---
icon: material/help-circle
---

# ❓ FAQ and Troubleshooting

Common questions and solutions for Educator Tools.

---

## 🚀 Installation Questions

??? note "Q: Where do I download Educator Tools?"
    **A:** Visit the [GitHub Releases page](https://github.com/ShapescapeMC/Educator-Tools/releases) and download the latest version. See the [Installation Guide](Installation.md) for detailed steps.

??? note "Q: Will Educator Tools work with my existing world?"
    **A:** Yes! You can add Educator Tools to any existing Minecraft Education world. Just activate the behavior pack in your world settings.

??? note "Q: Do my students need to install anything?"
    **A:** No installation needed for students! Only the world needs Educator Tools installed. When students join your world, they automatically have access to it - no installation needed on their end.

??? note "Q: Can I use Educator Tools on all platforms?"
    **A:** Yes. Educator Tools works on all platforms that support Minecraft Education (Windows, Mac, iPad, Chromebook).

---

## 🎯 Using the Tools

??? note "Q: How do I get the Educator Toolbox?"
    **A:** The toolbox appears automatically in your inventory when you join a world with Educator Tools active. Only players designated as teachers get the toolbox automatically.

    If you don't see it:

    1. Leave and rejoin the world
    2. Check Creative inventory and search for "Educator Toolbox"
    3. Verify the pack is active in World Settings → Behavior Packs

??? note "Q: Can students use the tools?"
    **A:** Students should not have access to the Educator Toolbox unless they're added to the Teachers team. Most tools are designed for teacher use only. Students can interact with assignments, timers, and other teacher-created activities.

??? note "Q: Why can't I use Teleport?"
    **A:** **Teleport requires at least 2 players online** (you + one student). If you're testing alone, the teleport button will be grayed out. Have at least one student join the world to use this feature.

---

## 🔧 Troubleshooting Issues

### Installation Problems

??? note "Problem: The pack doesn't appear in my Behavior Packs list"
    **Solution:**

    1. Make sure you downloaded the `.mcpack` or `.mcaddon` file (not the source code)
    2. Double-click the file to import it into Minecraft
    3. Check Settings → Storage → Behavior Packs to confirm it imported
    4. If still missing, try restarting Minecraft Education completely

??? note "Problem: I activated the pack but the toolbox isn't in my inventory"
    **Solutions to try:**

    1. **Leave and rejoin the world** - The toolbox appears when you join, not when you activate the pack
    2. **Check you're a teacher** - Only players designated as teachers get the toolbox automatically
    3. **Look in Creative inventory** - Search for "Educator Toolbox" item
    4. **Verify pack is active** - Go to World Settings → Behavior Packs and confirm it shows "Active"

??? note "Problem: The pack was working but stopped after an update"
    **Warning:** **Minecraft Education updates can affect pack compatibility.** Always check for the latest version of Educator Tools after Minecraft updates.

    **Solution:**

    1. Check if Minecraft Education updated recently
    2. Visit the [releases page](https://github.com/ShapescapeMC/Educator-Tools/releases) for the latest compatible version
    3. Remove the old version and install the new version
    4. Re-activate the pack in your world settings

---

### Tool Issues

??? note "Problem: Teleport doesn't work / button is grayed out"
    **Cause:** Teleport requires at least 2 players online (you + one student).

    **Solution:**

    - Have at least one student join the world
    - If testing alone, you can't use teleport
    - Try the tool again once students are online

??? note "Problem: Focus Mode won't turn on"
    **Solutions to try:**

    1. **Check your message** - Make sure you typed something in the message field
    2. **Verify target** - Confirm you selected a player or team to focus
    3. **Try "Disable Globally" button** - This button toggles between ON and OFF (confusing name, we know!)
    4. **Students offline** - Focus Mode works on offline students, but they won't see it until they log in

??? note "Problem: Timer isn't visible to students"
    **Check these:**

    1. **Did you click "Start"?** - Creating a timer doesn't automatically start it
    2. **Boss Bar visibility** - Timer shows at the very top of the screen (Boss Bar)
    3. **Other Boss Bars active** - Only one Boss Bar can show at a time
    4. **Timer deleted accidentally** - Recreate the timer

??? note "Problem: Students can still move during Focus Mode"
    **Note:** **This is expected if:**

    - Chat is still active (Minecraft limitation - can't disable chat)
    - You haven't clicked to actually enable Focus Mode yet
    - They're a teacher (teachers are never affected by Focus Mode)

    **If students can move when they shouldn't:**

    1. Confirm Focus Mode shows as "ON" for those students
    2. Try disabling and re-enabling
    3. Check if they're accidentally in the Teachers team

??? note "Problem: Letter Blocks don't appear in Creative inventory"
    **Solutions:**

    1. **Search for them** - Open inventory, use search box, type "letter"
    2. **Check correct tab** - Look in Construction or Items tabs
    3. **Verify Education** - Letter Blocks require Minecraft Education (not regular Minecraft)
    4. **Pack active** - Confirm Educator Tools pack is active in world settings

---

### Permission & Access Issues

??? note "Problem: A student has the Educator Toolbox when they shouldn't"
    **Solution:**
    Students shouldn't get the toolbox automatically. If they do:

    1. They might be in the "Teachers" team by accident
    2. Remove them from the Teachers team using [Teams Management](Student-Management-Tools.md#teams-management)
    3. The toolbox will disappear from their inventory

??? note "Problem: I'm a teacher but don't have the toolbox"
    **Solutions:**

    1. **Add yourself to Teachers team** - Use Teams Management to add yourself
    2. **Rejoin the world** - Leave and join again to trigger the toolbox appearing
    3. **Get it from Creative** - Open Creative inventory and search for "Educator Toolbox"

??? note "Problem: Students can use tools they shouldn't have access to"
    **Check:**

    1. Are they in the Teachers team? (would give them full access)
    2. Do they have Creative mode? (allows access to items via inventory)
    3. Are you testing in a single-player world? (default permissions are different)

    **Solution:** Verify team assignments and set appropriate gamemodes.

---

### Performance Issues

??? note "Problem: The world is laggy when using Educator Tools"
    **Potential causes:**

    1. **Too many students** - Large classes (30+ students) can strain performance
    2. **Lots of active tools** - Running multiple tools simultaneously (timers, locks, focus mode)
    3. **Large world size** - Extensive builds increase lag
    4. **Device limitations** - Older devices may struggle

    **Tip:** **Performance optimization tips:**

    - Disable tools not currently in use
    - Reduce world render distance in settings
    - Close other applications
    - Consider upgrading device if possible

??? note "Problem: Commands are slow to execute"
    **This is normal for:**

    - Large operations (copying inventory to all players)
    - First use after joining world (initialization delay)
    - Worlds with many players

    **Not normal if:**

    - Every action takes 10+ seconds
    - Tools frequently time out or fail

    **Warning:** **If experiencing abnormal slowness:**

    1. Restart the world
    2. Check internet connection (for multiplayer)
    3. Reduce number of active tools
    4. Report performance issue (see [Getting Help](Getting-Help.md))

---

### Assignment & Submission Issues

??? note "Problem: Students can't submit assignments"
    **Checklist:**

    1. **Is the assignment still active?** - Check it hasn't been marked "Complete"
    2. **Did they type a response?** - Text field can't be empty
    3. **Are they in the right assignment?** - Confirm they opened the correct one

    **Solution:** Verify assignment status and have student try again.

??? note "Problem: I can't see a student's submission"
    **Possible reasons:**

    1. **They haven't submitted yet** - Check with the student
    2. **Submission didn't save** - Have them resubmit
    3. **Assignment completed too soon** - Submissions might have been locked out

??? note "Problem: Assignment notifications don't appear"
    **This can happen if:**

    - "Notify Students" was toggled OFF when creating the assignment
    - Chat is moving too fast (message got buried)

---

### Nickname Issues

??? note "Problem: Nicknames don't show up in game"
    **Check settings:**

    1. Open **Custom Nicknames** → **Settings**
    2. Verify "Nicknames Enabled" is **ON**
    3. Check if "Require Approval" is ON - teacher must approve first
    4. Confirm nickname was actually set/approved

??? note "Problem: Students keep getting prompted to set nickname every time they join"
    **This happens when:**

    - "Prompt on Join" is ON
    - Student cancels without setting a nickname

    **Solutions:**

    1. Have student actually set a nickname (not cancel)
    2. Teacher can set their nickname manually (no prompt after that)
    3. Turn "Prompt on Join" OFF if you don't want automatic prompts

---

### World Settings Issues

??? note "Problem: I set time to Day but it's still night"
    **Solutions:**

    1. **Turn off Daylight Cycle** - Time might be progressing normally
    2. **Use "Always Day" button** - Sets time AND disables cycle in one click
    3. **Check if it's actually daytime** - Minecraft "Day" is morning, use "Noon" for brightest

??? note "Problem: Classroom Limitations don't seem to work"
    **Verify:**

    1. **You toggled the restriction ON** - Make sure it's enabled
    2. **You're testing with a student account** - Teachers are exempt from all limitations
    3. **Students rejoin after enabling** - Sometimes requires rejoin for restrictions to apply

    **Warning:** **If still not working:**

    - Check the student isn't in the Teachers team
    - Try disabling and re-enabling the restriction
    - Verify Educator Tools pack is up to date

---

## 💡 Advanced Topics

??? note "Q: Can I customize the letter blocks?"
    **A:** **Yes!** Educator Tools is open-source, so developers can create custom letter block sets. See the [Developer Documentation](Developer-Documentation.md) for guidance on adding new characters or symbols.

??? note "Q: How do I contribute to Educator Tools?"
    **A:** We welcome contributions! Follow these steps:

    1. Read the [Contributing Guide](Contributing.md)
    2. Set up your development environment with [Development Setup](Development-Setup.md)
    3. Submit pull requests on [GitHub](https://github.com/ShapescapeMC/Educator-Tools)

??? note "Q: Can I use Educator Tools in regular Minecraft?"
    **A:** **No.** Educator Tools is specifically designed for Minecraft Education and uses features not available in regular Minecraft (like special permissions, letter blocks, and education-specific commands).

---

## 🆘 Getting More Help

If your problem isn't listed here:

1. 📖 **Check the [Glossary](Glossary.md)** - Understand Minecraft-specific terms
2. 📝 **Read the [Getting Help](Getting-Help.md) guide** - Learn how to report issues
3. 🔍 **Visit the [Issue Tracker](https://github.com/ShapescapeMC/Educator-Tools/issues)** - See if others have the same problem
4. 💬 **Ask for help** - Create a new issue with details about your problem

---

## Tips to Avoid Problems

**Tip: Best Practices for Success**

✅ **Test tools in an empty world first** - Learn how they work before using with students

✅ **Keep Educator Tools updated** - Check for new versions regularly

✅ **Read tool descriptions carefully** - Many issues come from misunderstanding how tools work

✅ **Start simple** - Master basic tools before trying advanced features

✅ **Save your world regularly** - Back up your world in case something goes wrong

✅ **Check pack compatibility** - Verify your Minecraft Education version matches the pack


---

**Still stuck?** Visit [Getting Help](Getting-Help.md) to learn how to get support.

---

!!! tip "📝 Help us improve!"
    Have feedback about Educator Tools? [**Share your thoughts, it only takes 3 minutes →**](https://tally.so/r/0QPY9P){ target="_blank" }
