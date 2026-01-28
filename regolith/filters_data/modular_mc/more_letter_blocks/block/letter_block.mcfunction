UNPACK:HERE

{ts:
// Build clear function
const clearFunction = `definefunction <clear_letter_blocks>:\n${blocks.map(block => 
    `    execute as @a run execute unless score @s Team matches 0 run clear @s ${block}`
).join('\n')}`;

// Build give functions for each category
const giveFunctions = categoryNames.map(category_name => {
    const categoryIndex = categoryNames.indexOf(category_name);
    const categoryBlocks = categories[categoryIndex];
    const commands = categoryBlocks.map(block => 
        `    execute as @a run execute unless score @s Team matches 0 run give @s ${block}`
    ).join('\n');
    
    return `definefunction <give_${category_name}_letter_blocks>:\n    ## This function gives letter blocks for a specific category.\n    testfor @s\n${commands}`;
}).join('\n\n');

return `${clearFunction}\n\n${giveFunctions}`;
:}