import { Player, system, Vector2, Vector3, world } from "@minecraft/server";
import { LockPlayerService, LockSettings } from "./lock_player.service";
import { ModuleManager } from "../../module-manager";
import { TeamsService } from "../teams/teams.service";
import { Polyfill, Vec3 } from "@bedrock-oss/bedrock-boost";

/**
 * Mechanic responsible for enforcing player lock restrictions within specified teams.
 * Handles distance-based player containment with impulse pushing and teleportation mechanics.
 */
export class LockPlayerMechanic {
	static readonly id = "lock_player";

	/** System task ID for the main tick loop */
	private taskId: number | null = null;

	/** Reference to the teams service for team management */
	private teamsService: TeamsService;

	/** Maximum impulse force applied to players when pushing them back */
	private static readonly MAX_IMPULSE = 2;

	/** Distance buffer zone where impulse is applied instead of teleportation */
	private static readonly IMPULSE_BUFFER_ZONE = 16;

	/** Safety margin from the lock radius when teleporting players back */
	private static readonly TELEPORT_SAFETY_MARGIN = 5;

	private static readonly SPHERE_POINTS_COUNT = 3000;
	private static readonly SPHERE_POINTS_RADIUS = 3;

	/** Active boundary display jobs per player */
	private activeBoundaryJobs: Map<string, number> = new Map();

	constructor(
		private readonly lockPlayerService: LockPlayerService,
		private readonly moduleManager: ModuleManager,
	) {
		Polyfill.installPlayer();
	}

	/**
	 * Initializes the lock player mechanic by starting the main tick loop.
	 */
	initialize(): void {
		this.teamsService = this.moduleManager.getModule(
			TeamsService.id,
		) as TeamsService;
		this.taskId = system.runInterval(() => {
			this.tick();
		}, 1);
	}

	/**
	 * Main tick function that processes all locked teams and their members.
	 * Runs every game tick to enforce lock restrictions.
	 */
	tick(): void {
		const lockedTeams = this.lockPlayerService.getLockedTeams();

		// Process each locked team
		for (const teamId of lockedTeams) {
			this.processLockedTeam(teamId);
		}
	}

	/**
	 * Processes a single locked team and enforces restrictions on its members.
	 * @param teamId - The ID of the team to process
	 */
	private processLockedTeam(teamId: string): void {
		const lockSettings = this.lockPlayerService.getLockSettings(teamId);
		if (!lockSettings) {
			return;
		}

		// Update center location if bound to a player
		this.updatePlayerBoundCenter(teamId, lockSettings);

		const team = this.teamsService.getTeam(teamId);
		if (!team) {
			return;
		}

		// Process each team member
		for (const playerId of team.memberIds) {
			const player = world.getEntity(playerId) as Player;
			if (!player) {
				continue; // Skip offline players
			}

			// Skip teachers - they are exempt from lock restrictions
			if (this.lockPlayerService.isPlayerExempted(playerId)) {
				continue;
			}

			this.processPlayer(player, lockSettings);
		}
	}

	/**
	 * Updates the lock center if it's bound to a player's location.
	 * @param teamId - The team ID
	 * @param lockSettings - The current lock settings
	 */
	private updatePlayerBoundCenter(
		teamId: string,
		lockSettings: LockSettings,
	): void {
		if (!lockSettings.playerBound) {
			return;
		}

		const boundPlayer = world.getEntity(lockSettings.playerBound) as Player;
		if (boundPlayer) {
			lockSettings.center = boundPlayer.location;
			this.lockPlayerService.updateLockSettings(teamId, lockSettings);
		}
	}

	/**
	 * Processes a single player and applies lock restrictions if necessary.
	 * @param player - The player to process
	 * @param lockSettings - The lock settings to enforce
	 */
	processPlayer(player: Player, lockSettings: LockSettings): void {
		const playerLocation = player.location;
		const center = lockSettings.center;
		if (!center) {
			throw new Error(
				`LockPlayerMechanic: No center defined for player ${player.name}`,
			);
		}
		const distance = Vec3.from(playerLocation).distance(center);

		// Calculate dynamic activation radius based on lock radius
		const dynamicActivationRadius = Math.max(
			LockPlayerMechanic.SPHERE_POINTS_RADIUS,
			lockSettings.radius / 5,
		);

		if (
			lockSettings.showBoundaries &&
			lockSettings.radius - distance < dynamicActivationRadius
		) {
			this.displayBoundary(player, lockSettings);
		}

		// Player is within allowed radius - no action needed
		if (distance <= lockSettings.radius) {
			return;
		}

		// Player is outside radius - apply containment mechanics
		if (
			distance <
			lockSettings.radius + LockPlayerMechanic.IMPULSE_BUFFER_ZONE
		) {
			// Apply gentle impulse to push player back
			this.applyContainmentImpulse(player, center, playerLocation);
		} else {
			// Player is too far - teleport them back
			this.teleportPlayerBack(player, lockSettings, center, distance);
		}
	}

	/**
	 * Applies a gentle impulse to push the player back towards the center.
	 * @param player - The player to apply impulse to
	 * @param center - The center point of the lock area
	 * @param playerLocation - The current player location
	 */
	private applyContainmentImpulse(
		player: Player,
		center: any,
		playerLocation: any,
	): void {
		const impulse = {
			x: (center.x - playerLocation.x) * 0.1,
			y: 0.2, // Slight upward impulse to help with terrain
			z: (center.z - playerLocation.z) * 0.1,
		};

		// Cap the impulse to prevent excessive force
		impulse.x = Math.max(
			Math.min(impulse.x, LockPlayerMechanic.MAX_IMPULSE),
			-LockPlayerMechanic.MAX_IMPULSE,
		);
		impulse.y = Math.max(
			Math.min(impulse.y, LockPlayerMechanic.MAX_IMPULSE),
			-LockPlayerMechanic.MAX_IMPULSE,
		);
		impulse.z = Math.max(
			Math.min(impulse.z, LockPlayerMechanic.MAX_IMPULSE),
			-LockPlayerMechanic.MAX_IMPULSE,
		);

		player.applyImpulse(impulse);
		player.onScreenDisplay.setActionBar([
			{ translate: "edu_tools.actionbar.lock_player.too_far_push" },
		]);
	}

	/**
	 * Teleports the player back to either the center or the edge of the allowed area.
	 * @param player - The player to teleport
	 * @param lockSettings - The lock settings containing teleport preferences
	 * @param center - The center point of the lock area
	 * @param distance - The current distance from center
	 */
	private teleportPlayerBack(
		player: Player,
		lockSettings: LockSettings,
		center: any,
		distance: number,
	): void {
		if (lockSettings.teleportToCenter) {
			// Teleport directly to center
			player.teleport(center, {
				rotation: player.getRotation(),
			});

			if (lockSettings.showLockMessage) {
				player.sendMessage([
					{
						translate: "edu_tools.message.too_far_teleport_center",
					},
				]);
			}
		} else {
			// Teleport to edge of allowed area
			this.teleportToAreaEdge(player, center, lockSettings.radius, distance);

			if (lockSettings.showLockMessage) {
				player.sendMessage([
					{
						translate: "edu_tools.message.too_far_teleport_area",
					},
				]);
			}
		}

		// Play teleportation sound effect
		player.playSound("mob.endermen.portal");
	}

	/**
	 * Teleports the player to the edge of the allowed area.
	 * @param player - The player to teleport
	 * @param center - The center point of the lock area
	 * @param radius - The lock radius
	 * @param distance - The current distance from center
	 */
	private teleportToAreaEdge(
		player: Player,
		center: any,
		radius: number,
		distance: number,
	): void {
		// Calculate direction from center to player
		const direction: Vector2 = {
			x: player.location.x - center.x,
			y: player.location.z - center.z,
		};

		// Normalize the direction vector
		const normalizedDirection: Vector2 = {
			x: direction.x / distance,
			y: direction.y / distance,
		};

		// Calculate the closest valid point on the circle edge (with safety margin)
		const safeRadius = radius - LockPlayerMechanic.TELEPORT_SAFETY_MARGIN;
		const targetPoint: Vector2 = {
			x: center.x + normalizedDirection.x * safeRadius,
			y: center.z + normalizedDirection.y * safeRadius,
		};

		// Use spreadplayers command for safe teleportation (handles terrain)
		player.runCommand(
			`/spreadplayers ${targetPoint.x} ${targetPoint.y} 0 1 @s`,
		);
	}

	displayBoundary(player: Player, lockSettings: LockSettings): void {
		if (!lockSettings) {
			return;
		}

		const playerId = player.id;

		// Check if there's already an active job for this player
		const existingJobId = this.activeBoundaryJobs.get(playerId);
		if (existingJobId !== undefined) {
			// Job is still running, no need to start a new one
			return;
		}

		const center = lockSettings.center;
		const radius = lockSettings.radius;

		// Calculate distance from player to boundary edge
		const playerDistance = Vec3.from(player.location).distance(center);
		const distanceFromEdge = radius - playerDistance;

		// Calculate dynamic sphere points count with radius scaling
		const dynamicPointsCount = this.calculateDynamicPointsCount(
			distanceFromEdge,
			radius,
		);

		const spherePoints = this.generateSpherePoints(
			center,
			radius,
			dynamicPointsCount,
			player.location,
			LockPlayerMechanic.SPHERE_POINTS_RADIUS,
		);

		if (spherePoints.length === 0) {
			return; // No points generated, nothing to display
		}

		// Start the boundary display job
		const jobId = system.runJob(
			this.boundaryDisplayGenerator(player, spherePoints),
		);
		this.activeBoundaryJobs.set(playerId, jobId);
	}

	/**
	 * Calculates the dynamic sphere points count based on distance from boundary edge.
	 * Returns 100% of SPHERE_POINTS_COUNT when player is at SPHERE_POINTS_RADIUS+1 blocks from edge,
	 * and reduces by 15% for each additional block of distance.
	 * Also applies radius-based scaling (SPHERE_POINTS_COUNT * radius/5).
	 * @param distanceFromEdge - The distance from the player to the boundary edge
	 * @param radius - The lock radius for scaling calculation
	 * @returns The calculated number of sphere points to generate
	 */
	private calculateDynamicPointsCount(
		distanceFromEdge: number,
		radius: number,
	): number {
		const thresholdDistance = LockPlayerMechanic.SPHERE_POINTS_RADIUS + 1;

		// Calculate base count with radius scaling
		const baseCount = Math.floor(
			LockPlayerMechanic.SPHERE_POINTS_COUNT * (radius / 5),
		);

		// If player is at or closer than threshold distance, use full count
		if (distanceFromEdge >= thresholdDistance) {
			return baseCount;
		}

		// Calculate how many blocks beyond threshold the player is
		const blocksOverThreshold = thresholdDistance - distanceFromEdge;

		// Apply 15% reduction per block (0.85 multiplier per block)
		const reductionFactor = Math.pow(0.85, blocksOverThreshold);

		// Calculate final count and ensure it's at least 1
		const dynamicCount = Math.max(1, Math.floor(baseCount * reductionFactor));

		return dynamicCount;
	}

	/**
	 * Generator function that displays boundary particles with yielding between spawns
	 * @param player - The player to display boundaries for
	 * @param spherePoints - Array of points to display as particles
	 */
	private *boundaryDisplayGenerator(
		player: Player,
		spherePoints: Vector3[],
	): Generator<void, void, void> {
		const playerId = player.id;

		try {
			for (const point of spherePoints) {
				// Check if player still exists
				const currentPlayer = world.getEntity(playerId) as Player;
				if (!currentPlayer) {
					break; // Player no longer exists, stop generating
				}

				currentPlayer.dimension.spawnParticle(
					"minecraft:redstone_wire_dust_particle",
					point,
				);

				// Yield to allow other operations to run
				yield;
			}
		} finally {
			// Clean up the job tracking when generator completes or is interrupted
			this.activeBoundaryJobs.delete(playerId);
		}
	}

	/**
	 * Generates a list of points on the surface of a sphere that are within maxDistance from targetPosition.
	 * Uses optimized angular filtering to avoid generating unnecessary points.
	 * @param center The center of the sphere.
	 * @param radius The radius of the sphere.
	 * @param n The number of points to attempt to generate.
	 * @param targetPosition The position to filter points around.
	 * @param maxDistance Maximum distance from targetPosition.
	 */
	private generateSpherePoints(
		center: Vector3,
		radius: number,
		n: number,
		targetPosition: Vector3,
		maxDistance: number,
	): Vector3[] {
		const points: Vector3[] = [];

		// Calculate the direction from sphere center to target position
		const dirToTarget = {
			x: targetPosition.x - center.x,
			y: targetPosition.y - center.y,
			z: targetPosition.z - center.z,
		};

		const distToTarget = Math.sqrt(
			dirToTarget.x * dirToTarget.x +
				dirToTarget.y * dirToTarget.y +
				dirToTarget.z * dirToTarget.z,
		);

		// If target is at center, return all points
		if (distToTarget < 0.001) {
			return this.generateAllSpherePoints(center, radius, n);
		}

		// Normalize direction to target
		const normalizedDir = {
			x: dirToTarget.x / distToTarget,
			y: dirToTarget.y / distToTarget,
			z: dirToTarget.z / distToTarget,
		};

		// Calculate the maximum angular deviation (half-angle of cone)
		// Using law of cosines: cos(angle) = (radius² + distToTarget² - maxDistance²) / (2 * radius * distToTarget)
		const cosMaxAngle = Math.max(
			-1,
			Math.min(
				1,
				(radius * radius +
					distToTarget * distToTarget -
					maxDistance * maxDistance) /
					(2 * radius * distToTarget),
			),
		);
		const maxAngle = Math.acos(cosMaxAngle);

		const goldenRatio = (1 + Math.sqrt(5)) / 2;
		const angleIncrement = 2 * Math.PI * goldenRatio;

		for (let i = 0; i < n; i++) {
			const t = i / n;
			const inclination = Math.acos(1 - 2 * t);
			const azimuth = angleIncrement * i;

			// Calculate point on sphere
			const spherePoint = {
				x: Math.sin(inclination) * Math.cos(azimuth),
				y: Math.sin(inclination) * Math.sin(azimuth),
				z: Math.cos(inclination),
			};

			// Calculate angle between this point and target direction
			const dotProduct =
				spherePoint.x * normalizedDir.x +
				spherePoint.y * normalizedDir.y +
				spherePoint.z * normalizedDir.z;
			const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

			// Only include points within the angular cone
			if (angle <= maxAngle) {
				const worldPoint = {
					x: center.x + radius * spherePoint.x,
					y: center.y + radius * spherePoint.y,
					z: center.z + radius * spherePoint.z,
				};
				points.push(worldPoint);
			}
		}

		return points;
	}

	/**
	 * Generates all points on sphere (fallback for when target is at center)
	 */
	private generateAllSpherePoints(
		center: Vector3,
		radius: number,
		n: number,
	): Vector3[] {
		const points: Vector3[] = [];
		const goldenRatio = (1 + Math.sqrt(5)) / 2;
		const angleIncrement = 2 * Math.PI * goldenRatio;

		for (let i = 0; i < n; i++) {
			const t = i / n;
			const inclination = Math.acos(1 - 2 * t);
			const azimuth = angleIncrement * i;

			const x = center.x + radius * Math.sin(inclination) * Math.cos(azimuth);
			const y = center.y + radius * Math.sin(inclination) * Math.sin(azimuth);
			const z = center.z + radius * Math.cos(inclination);

			points.push({ x, y, z });
		}

		return points;
	}

	/**
	 * Stops the lock player mechanic by clearing the tick interval.
	 */
	stop(): void {
		if (this.taskId !== null) {
			system.clearRun(this.taskId);
			this.taskId = null;
		}

		// Clear all active boundary jobs
		for (const [playerId, jobId] of this.activeBoundaryJobs.entries()) {
			system.clearJob(jobId);
		}
		this.activeBoundaryJobs.clear();
	}
}
