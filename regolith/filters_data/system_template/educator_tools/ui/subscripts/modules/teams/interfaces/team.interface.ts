export interface Team extends TeamsData {
	id: string;
	memberIds: string[];
	isSystem?: boolean; // Flag to identify system-generated teams
	editable?: boolean; // Flag to control if team can be modified
	minimumMembers?: number; // Minimum number of members required for the team
	maximumMembers?: number; // Maximum number of members allowed in the team
}

export interface TeamsData {
	name: string;
	color?: string;
	icon?: string; // Optional icon for the team
	description?: string;
	host_auto_assign?: boolean; // Whether the team should auto-assign members
}
