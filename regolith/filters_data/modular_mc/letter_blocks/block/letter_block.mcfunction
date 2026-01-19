UNPACK:HERE

definefunction <clear_letter_blocks>:
    foreach <_ block blocks>:
        execute as @a run execute unless score @s Team matches 0 run clear @s `eval:block`

foreach <_ category_name category_names>:
    definefunction <give_`eval:category_name`_letter_blocks>:
        ## This function gives letter blocks for a specific category.
        testfor @s
        foreach <_ block categories[category_names.index(category_name)]>:
            execute as @a run execute unless score @s Team matches 0 run give @s `eval:block`