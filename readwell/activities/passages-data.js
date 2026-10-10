/* =========================================================
   ReadWell — reading passages (hand-written, no AI)
   One entry per story. Familiar fairy tales and fables retold in
   our own short words. To add a story: add it here, then add its
   questions in questions-data.js using the same passageId.
   Fields: passageId, title, level, description, paragraphs
   ========================================================= */
(function (global) {
    'use strict';
    var RW = global.RW = global.RW || {};
    RW.data = RW.data || {};

    RW.data.passages = [
        {
            "passageId": "three-little-pigs",
            "title": "The Three Little Pigs",
            "level": "beginner",
            "description": "Three pigs build houses. A hungry wolf wants to blow them down.",
            "paragraphs": [
                "Three little pigs left home to build their own houses. The first pig was lazy. He built his house out of straw. It took him only one hour.",
                "The second pig built his house out of sticks. It took him two hours. The third pig worked hard all day long. He built his house out of bricks.",
                "One day, a hungry wolf came to the straw house. He huffed and puffed and blew it down. The first pig ran to the stick house. The wolf huffed and puffed again, and the sticks flew everywhere. Now two pigs ran to the brick house.",
                "The wolf huffed and puffed at the brick house, but it did not fall. The bricks were too strong. The wolf was tired and cross, so he went away. The three pigs were safe and happy."
            ]
        },
        {
            "passageId": "tortoise-and-hare",
            "title": "The Tortoise and the Hare",
            "level": "beginner",
            "description": "A fast hare brags. A slow tortoise says, \"Let us race.\"",
            "paragraphs": [
                "A hare liked to brag about how fast he could run. 'No one can beat me,' he said. A slow old tortoise heard him. 'I will race you,' said the tortoise.",
                "The animals of the forest came to watch. The fox said, 'Ready, set, go!' The hare dashed away and was soon far ahead. The tortoise walked on, one slow step at a time.",
                "The hare looked back and could not see the tortoise anywhere. 'I have lots of time,' he laughed. He lay down under a tree and fell asleep.",
                "The tortoise kept walking. He did not stop, not even to rest. When the hare woke up, the tortoise was almost at the finish line! The hare ran as fast as he could, but he was too late. The tortoise won the race."
            ]
        },
        {
            "passageId": "goldilocks",
            "title": "Goldilocks and the Three Bears",
            "level": "beginner",
            "description": "A hungry girl walks into a house in the woods.",
            "paragraphs": [
                "Three bears lived in a little house in the woods. There was Papa Bear, Mama Bear, and Baby Bear. One morning, they made porridge for breakfast. The porridge was too hot to eat, so the bears went for a walk.",
                "A girl named Goldilocks came to the house. The door was open, so she went inside. She was hungry. She tasted Papa Bear's porridge. It was too hot. She tasted Mama Bear's porridge. It was too cold. Then she tasted Baby Bear's porridge. It was just right, and she ate it all up.",
                "Next, Goldilocks felt sleepy. She tried Papa Bear's chair, but it was too hard. She tried Mama Bear's chair, but it was too soft. Baby Bear's chair was just right, but it broke into pieces when she sat on it!",
                "Goldilocks went upstairs and found three beds. She fell asleep in Baby Bear's little bed. Soon the bears came home. 'Someone ate my porridge!' cried Baby Bear. When they found Goldilocks, she woke up, jumped out of the window, and ran home as fast as she could."
            ]
        },
        {
            "passageId": "little-red-hen",
            "title": "The Little Red Hen",
            "level": "beginner",
            "description": "A hen asks for help, and no one will give it.",
            "paragraphs": [
                "A little red hen lived on a farm with a dog, a cat, and a duck. One day, she found some grains of wheat. 'Who will help me plant this wheat?' she asked.",
                "'Not I,' said the dog. 'Not I,' said the cat. 'Not I,' said the duck. 'Then I will do it myself,' said the little red hen. And she did.",
                "When the wheat was tall, the hen asked, 'Who will help me cut the wheat?' The others said, 'Not I.' So the hen cut it herself. Then she asked who would help take the wheat to the mill and bake the bread. Each time, the dog, the cat, and the duck said, 'Not I.' Each time, the hen did the work herself.",
                "At last the bread was ready. It smelled so good! 'Who will help me eat this bread?' asked the hen. 'I will!' said the dog. 'I will!' said the cat. 'I will!' said the duck. 'No,' said the little red hen. 'You did not help me, so I will eat it myself.' And she did. The other animals felt very sorry."
            ]
        },
        {
            "passageId": "ugly-duckling",
            "title": "The Ugly Duckling",
            "level": "beginner",
            "description": "A duckling feels different, until spring comes.",
            "paragraphs": [
                "A mother duck sat on her nest. One by one, her eggs cracked open. Out came five fluffy yellow ducklings. The last egg was bigger than the others. When it cracked, a gray, scruffy duckling came out.",
                "The other animals on the farm laughed at him. 'You are so ugly!' they said. The little duckling felt sad and alone. He ran away from the farm.",
                "All summer and autumn he hid by a cold pond. Winter came, and the pond froze. He was lonely and very cold. Many nights he had no one to talk to.",
                "When spring came, the duckling saw three beautiful white swans on the water. He swam up to them, ready to be teased again. But he looked down at the water and saw his own face. He was not an ugly duckling at all. He had grown into a graceful swan! The other swans welcomed him, and he was never lonely again."
            ]
        },
        {
            "passageId": "boy-who-cried-wolf",
            "title": "The Boy Who Cried Wolf",
            "level": "beginner",
            "description": "A bored shepherd boy plays a trick on his village.",
            "paragraphs": [
                "A boy named Tom watched the village sheep on a green hill. He sat alone all day, and he was very bored.",
                "To have some fun, Tom shouted, 'Wolf! Wolf! A wolf is chasing the sheep!' The villagers ran up the hill with sticks. There was no wolf. Tom laughed at them. The next day he played the same trick, and again the villagers came running.",
                "Then one evening a real wolf crept out of the woods. Tom cried, 'Wolf! Wolf! Please help me!' But the villagers said, 'He is tricking us again,' and they stayed home.",
                "The wolf scared the sheep away. Tom ran to the village in tears. He felt sorry and ashamed. 'Now no one believes me, even when I tell the truth,' he said."
            ]
        },
        {
            "passageId": "lion-and-mouse",
            "title": "The Lion and the Mouse",
            "level": "beginner",
            "description": "A tiny mouse makes a big promise to a lion.",
            "paragraphs": [
                "A lion was asleep under a tree when a tiny mouse ran across his nose. The lion woke up with a roar and trapped the mouse under his big paw.",
                "'Please let me go,' squeaked the mouse. 'Someday I will help you.' The lion laughed. 'How could a little mouse ever help a mighty lion?' But he lifted his paw and let the mouse scamper away.",
                "A few days later, hunters caught the lion in a strong rope net. He roared and roared, but he could not get free. The mouse heard the lion's cry and came running.",
                "The mouse chewed the thick ropes with his sharp little teeth. Soon the net fell apart, and the lion was free. 'You were right,' said the lion. 'Even small friends can do great things.'"
            ]
        },
        {
            "passageId": "peter-pan",
            "title": "Peter Pan",
            "level": "intermediate",
            "description": "A boy who never grows up invites three children to Neverland.",
            "paragraphs": [
                "Wendy, John, and Michael Darling lived in London. Every night, Wendy told her brothers stories at bedtime. Her favorite stories were about a boy named Peter Pan, who never grew up and lived in a faraway place called Neverland.",
                "One night, Peter Pan flew into the nursery. He had lost his shadow, and he had come back to look for it. Wendy sewed it back onto his feet with a needle and thread. Peter was so happy that he danced around the room. 'Come with me to Neverland!' he said. 'You can tell stories to the Lost Boys, and they have no mother.'",
                "Peter sprinkled fairy dust on the children. 'Think happy thoughts,' he told them, 'and you will fly.' At first, the children only hopped. Then they thought about their favorite things, and their feet lifted off the floor. Soon all three were floating out of the window and into the night sky.",
                "They flew past the moon and over the sea. Tinker Bell, a tiny fairy, flew beside them. She glowed like a little lantern, but she was jealous of Wendy and did not want her to come. After many hours, Peter pointed to a dark island below. 'There it is,' he whispered. 'Neverland!'"
            ]
        },
        {
            "passageId": "alice-wonderland",
            "title": "Alice's Adventures in Wonderland",
            "level": "intermediate",
            "description": "Alice follows a rabbit with a watch down a very deep hole.",
            "paragraphs": [
                "Alice was sitting on a riverbank with her older sister, and she was growing very bored. Her sister's book had no pictures in it, and Alice wondered what good a book could be without pictures. Suddenly, a white rabbit in a waistcoat ran past her. He pulled a watch out of his pocket. 'Oh dear! I shall be late!' he muttered.",
                "Alice had never seen a rabbit with a watch, so she was curious. She chased him across the field and saw him pop down a large rabbit hole. Without thinking, she jumped in after him.",
                "The hole was very deep, and Alice fell slowly, as if she were floating down. She had time to look at the shelves along the walls, which were crammed with jars, maps, and pictures. She picked up a jar labeled 'ORANGE MARMALADE,' but it was empty, so she put it back on another shelf as she drifted by.",
                "At last, she landed with a soft thump on a heap of dry leaves. She was not hurt at all. Before her was a long, low hallway lit by hanging lamps, and at the far end, she caught a glimpse of the White Rabbit hurrying around a corner. Alice jumped up and hurried after him, wondering what strange thing would happen next."
            ]
        },
        {
            "passageId": "wizard-of-oz",
            "title": "The Wonderful Wizard of Oz",
            "level": "intermediate",
            "description": "A tornado carries Dorothy far from Kansas.",
            "paragraphs": [
                "A strong wind swept across the flat plains of Kansas, and a girl named Dorothy ran toward her house. Before she could reach the storm cellar, a tornado lifted the whole house into the air. Dorothy and her little dog, Toto, were inside. The house spun around and around, and then it floated gently down to the ground.",
                "When Dorothy opened the door, she saw a land full of bright flowers and singing birds. This was not Kansas! A small group of tiny people called Munchkins were looking at her. Her house had landed on top of a wicked witch, and the Munchkins were free. They cheered for Dorothy.",
                "Dorothy only wanted to go home. 'The Wizard of Oz in the Emerald City can help you,' said a kind witch named Glinda. 'Follow the yellow brick road.' Dorothy put on the witch's silver shoes, which Glinda said were magic, and set out with Toto.",
                "Along the way, she met a Scarecrow who wanted a brain, a Tin Man who wanted a heart, and a Lion who wanted courage. They all agreed to travel with her to the Emerald City, where each hoped the Wizard could give them what they wanted."
            ]
        },
        {
            "passageId": "pinocchio",
            "title": "Pinocchio",
            "level": "intermediate",
            "description": "A puppet comes to life and learns a hard lesson about honesty.",
            "paragraphs": [
                "Geppetto was an old woodcarver who lived alone. One day, he carved a wooden puppet and named him Pinocchio. That night, a kind fairy visited the workshop. 'You have always been good to others, Geppetto,' she said. 'I will make your puppet come alive.' With a wave of her wand, Pinocchio began to move and talk.",
                "The fairy warned Pinocchio to be good, to go to school, and to tell the truth. 'If you do,' she said, 'one day you may become a real boy.' Pinocchio promised, but he was easily tempted. On his way to school, he met a fox and a cat who told him about a magical show where he could be a star. Pinocchio sold his schoolbook to buy a ticket and ran to the show.",
                "When he finally came home late, the fairy asked where he had been. Pinocchio told a lie. At once, his wooden nose grew longer, and longer, and longer. 'A lie is like a nose,' said the fairy. 'It cannot be hidden, because it grows right on your face.' Pinocchio felt ashamed.",
                "Pinocchio cried and promised to tell the truth from then on. The fairy smiled and used her magic to shrink his nose back to normal. Pinocchio learned that it is much better to be honest, even when it is hard."
            ]
        },
        {
            "passageId": "jungle-book",
            "title": "The Jungle Book",
            "level": "intermediate",
            "description": "A boy raised by wolves must decide where he belongs.",
            "paragraphs": [
                "Deep in the jungles of India, a wolf pack found a baby boy who was lost and alone. The pack's mother wolf, Raksha, took him in and named him Mowgli. She raised him alongside her own cubs. Mowgli grew up strong and quick, and he learned the ways of the jungle.",
                "His teachers were Baloo the bear, who taught him the Law of the Jungle, and Bagheera the black panther, who taught him to climb and to sneak quietly. The Law said that the strong must protect the weak, and that you should never hunt more than you need.",
                "But a fierce tiger named Shere Khan hated people. He had wanted to catch Mowgli since the day he was found. When Mowgli was older, Shere Khan stalked the wolf pack, demanding that they give up the man-cub. The wolves would not betray their friend.",
                "Bagheera warned Mowgli that he would not be safe in the jungle forever. 'You must go to the village of men,' he said sadly. Mowgli did not want to leave his family, but he knew it was the wisest choice. The next morning, he said goodbye to Baloo and the wolves, and set off at dawn toward the village."
            ]
        },
        {
            "passageId": "jack-and-beanstalk",
            "title": "Jack and the Beanstalk",
            "level": "intermediate",
            "description": "A boy trades his cow for magic beans and climbs into the clouds.",
            "paragraphs": [
                "Jack and his mother lived in a tiny cottage and were very poor. They had nothing left but an old cow named Milky-White. One morning his mother said, 'Take her to market and sell her. We need the money for food.'",
                "On the road, Jack met a strange old man holding a handful of beans. 'These beans are magic,' he whispered. 'Trade me your cow for them.' Jack liked the idea of magic, so he agreed. He hurried home, whistling all the way, proud of his bargain.",
                "His mother was furious. 'Beans? You gave away our only cow for beans?' She threw them out of the window and sent Jack to bed with no supper. In the morning, a huge green beanstalk, thick as a tree trunk, had grown right up into the clouds.",
                "Jack climbed and climbed until he reached a castle in the sky, where a giant lived. Jack tiptoed inside, trying not to make a sound, and saw a hen that laid golden eggs. When the giant fell asleep, Jack grabbed the hen and ran. The giant woke with a thundering roar and chased him down the stalk.",
                "At the bottom, Jack snatched up an axe and chopped the beanstalk down. The giant fell with it and was never seen again. The golden eggs kept Jack and his mother from ever being poor again, and Jack promised his mother that he would think carefully before trading anything away."
            ]
        },
        {
            "passageId": "treasure-island",
            "title": "Treasure Island",
            "level": "advanced",
            "description": "A boy finds a map and sails with a crew he cannot fully trust.",
            "paragraphs": [
                "The old sailor who rented a room at the Admiral Benbow Inn was a rough man with a scarred face. He drank rum all day, and he told wild stories of pirates that made the guests shudder. The innkeeper's son, Jim Hawkins, noticed that the old sailor kept a sharp lookout toward the sea, as if he were expecting trouble. 'Beware of a one-legged seafaring man,' he warned Jim, and he paid Jim a silver coin each month to watch for such a visitor.",
                "One stormy winter evening, the old sailor died suddenly, and Jim and his mother opened his heavy sea chest. They were only looking for the money he owed them, and they took exactly that and nothing more. At the bottom of the chest, Jim found an oilskin packet. Inside was a map of an island, marked with a red cross. Beside it, someone had written a note: 'Treasure buried here.'",
                "Jim hurried to show the map to Dr. Livesey and Squire Trelawney, two trusted friends in the village. The squire's eyes grew wide. 'This is the treasure map of the famous Captain Flint!' he cried. 'We must find that island at once.' Within weeks, the squire bought a ship named the Hispaniola, hired a captain and crew, and invited Jim to come along as the cabin boy.",
                "Jim could hardly sleep the night before they sailed. He was thrilled by the idea of a real adventure, but a little afraid, too. At the harbor, he met the ship's cook, a friendly man with only one leg and a wooden crutch, named Long John Silver. Silver greeted him with a warm smile and a joke, and Jim liked him immediately. He had no idea that the cheerful cook was hiding a dangerous secret."
            ]
        },
        {
            "passageId": "secret-garden",
            "title": "The Secret Garden",
            "level": "advanced",
            "description": "A lonely girl finds a key to a garden that no one has entered in years.",
            "paragraphs": [
                "Mary Lennox was a sour, lonely girl. After her parents died far away in India, she was sent to live with her uncle, Archibald Craven, in a huge, gloomy house on the Yorkshire moors. Her uncle was always traveling, and the house had a hundred rooms, most of them locked. Nobody in the house seemed to want her there, and Mary did not want to be there either.",
                "The only friendly person Mary met was a young housemaid named Martha, who chatted away as she lit the fire. 'There's a garden at the house that's been locked for ten years,' Martha said. 'Mr. Craven's wife died there when a branch broke, and he shut the gate and buried the key.' Mary felt a sudden spark of curiosity. A hidden garden! For the first time in a long while, she wanted to find something out.",
                "Day after day, Mary played outside on the cold, windy moor. The fresh air made her hungry for the first time, and her thin cheeks grew rosy. One morning, a little robin hopped near her and tugged a worm from the soil. Mary saw something glinting in the dirt near its feet: a rusty old key. She picked it up and tucked it in her pocket, wondering what door it might open.",
                "A few days later, the robin led her to a patch of ivy by an old stone wall. The wind blew the leaves apart, and Mary saw a round brass knob. Her heart pounded. She pushed aside the ivy, slipped the key into the lock, and turned it. The door swung open with a creak. Mary stepped through, closed the door behind her, and gazed at the secret garden that no one had entered for ten years."
            ]
        },
        {
            "passageId": "tom-sawyer",
            "title": "The Adventures of Tom Sawyer",
            "level": "advanced",
            "description": "Tom is given a boring job and finds a clever way out of it.",
            "paragraphs": [
                "Saturday morning had come, and the whole summer world seemed bright, fresh, and full of life. But Tom Sawyer did not feel cheerful. Standing in front of him was a long fence, thirty yards of rough boards, and in his hand was a bucket of whitewash. His Aunt Polly had ordered him to paint it as punishment for getting into mischief. Tom sighed. Hours of boring work lay ahead while his friends played outside.",
                "Just then, an idea popped into his head. Tom began to paint slowly and carefully, stepping back to admire each stroke as if it were a work of art. His friend Ben Rogers strolled up, munching an apple. 'Hello, old fellow! You're stuck working, aren't you?' Ben teased. Tom pretended not to hear him. He swept the brush along a board with a flourish and studied the result with a thoughtful frown.",
                "'Work?' said Tom at last, as though surprised. 'Why, I don't call this work. Does a boy get the chance to whitewash a fence every day?' That put the matter in a new light. Ben stopped chewing. 'Say, Tom, let me try it,' he begged. Tom shook his head. 'Aunt Polly is very particular about this fence. I don't believe one boy in a thousand could do it right.' Ben offered him the apple core, and then the whole apple, for a turn with the brush.",
                "Soon other boys wandered by, and one after another they paid for the chance to paint. By afternoon, Tom had collected a kite, a jar of beetles, twelve marbles, and a piece of blue bottle glass, and the fence had three coats of whitewash. Tom had discovered an important rule: if you want people to want something, make it hard to get."
            ]
        },
        {
            "passageId": "wind-in-the-willows",
            "title": "The Wind in the Willows",
            "level": "advanced",
            "description": "A mole leaves his spring cleaning and finds a river.",
            "paragraphs": [
                "Mole had spent the whole morning spring-cleaning his small, dark home underground. He had dusted the shelves, scrubbed the floors, and whitewashed the walls until his arms ached and his nose was covered in dust. Suddenly, he flung down his brush. 'Enough of this!' he cried. 'I am sick of it.' Without even stopping for his coat, he scurried up the tunnel toward the surface.",
                "Up in the meadow, the sun warmed his fur, and a gentle breeze carried the scent of blossoms. Birds sang in the hedges, and the whole world seemed to be celebrating spring. Mole felt as though he could dance. He scampered across the grass until he reached the bank of a sparkling river. He had never seen a river before, and he stared at it in wonder.",
                "On the far bank, a round, whiskered face peeked out from a hole. It was a Water Rat. 'Hello, Mole!' the Rat called. 'Would you like to come over?' Mole blinked. 'How could I? I cannot swim.' The Rat laughed kindly, untied a little blue-and-white boat from the bank, and rowed across to fetch him.",
                "Mole stepped carefully into the boat and sat down on the cushions, feeling excited and nervous at the same time. 'Believe me, my young friend,' said the Rat as he rowed, 'there is nothing better than simply messing about in boats.' Mole leaned back as the boat drifted along. He decided that this was the finest day of his life, and he did not once think about his dusty house."
            ]
        },
        {
            "passageId": "anne-green-gables",
            "title": "Anne of Green Gables",
            "level": "advanced",
            "description": "A talkative girl arrives when a boy was expected.",
            "paragraphs": [
                "Matthew Cuthbert stood on the train platform at Bright River, feeling terribly shy. He had come to pick up the boy that he and his sister Marilla had asked to adopt, to help with the work on their farm. But the only person waiting was a skinny girl of about eleven with bright red braids, a worn suitcase, and enormous gray eyes. Matthew's face turned pink. He did not know what to say.",
                "'You must be Mr. Cuthbert,' the girl said, jumping up. 'I was afraid you weren't coming, so I imagined myself climbing a cherry tree and sleeping in the blossoms.' Her words tumbled out so fast that Matthew could hardly keep up. 'My name is Anne, with an E,' she announced. 'It looks so much more distinguished.'",
                "Matthew was too gentle to tell her about the mistake. He lifted her suitcase and led her to his buggy. All the way home, Anne chatted about everything she saw. She named the white-blossomed road 'the Avenue' and gasped at a shimmering pond, which she named 'the Lake of Shining Waters.' Matthew, who was quiet by nature, found himself listening with a smile. He had not enjoyed anyone's company so much in years.",
                "At Green Gables, Marilla stared in dismay. 'Where is the boy?' she demanded. Matthew explained the mix-up, and Anne burst into tears, sure she would be sent back. Marilla, who was stern but fair, softened. 'Nobody is sending you anywhere tonight,' she said. 'We will decide in the morning.' That night, Anne fell asleep hoping she could stay forever."
            ]
        },
        {
            "passageId": "cinderella",
            "title": "Cinderella",
            "level": "advanced",
            "description": "A kind girl treated badly gets a night of magic at the royal ball.",
            "paragraphs": [
                "Long ago, a kind girl named Cinderella lived in a large house with her father. When he died, she was left with her stepmother and two stepsisters, who were proud and unkind. They made Cinderella cook, scrub the floors, and sleep by the fireplace, where ashes covered her clothes. That is how she got her name. Still, she never complained, and she was gentle with the mice and birds that visited the kitchen.",
                "One day, an invitation arrived from the palace. The king was holding a grand ball so that his son, the prince, could meet the young people of the kingdom. The stepsisters were thrilled and spent days choosing their dresses. Cinderella longed to go too, but her stepmother said, 'You have too much work to do, and you have nothing to wear.' Then the family left for the palace, and Cinderella sat down and cried. The house felt very quiet and very empty.",
                "Suddenly, a kind fairy godmother appeared in the kitchen. With a wave of her wand, she turned a pumpkin into a coach and Cinderella's rags into a shimmering gown, and she added a pair of glass slippers. 'Enjoy the ball,' said the fairy, 'but you must leave before midnight. When the clock strikes twelve, the magic will end.' Cinderella thanked her again and again, and her heart felt light as she climbed into the coach.",
                "At the palace, everyone stared at the beautiful stranger. The prince danced with her all evening, and Cinderella forgot about the time. When the clock began to strike twelve, she hurried down the steps. In her rush, one glass slipper slipped off her foot. She did not stop to pick it up, and the prince found it lying there. He held it carefully and wondered who the mysterious girl could be.",
                "The next day, the prince traveled to every house in the kingdom, saying he would marry the girl whose foot fit the slipper. The stepsisters squeezed and pushed, but it was too small for them. When Cinderella tried it on, it fit perfectly. The prince knew he had found her, and his face lit up with joy. Cinderella forgave her stepfamily for their cruelty and married the prince, and she stayed as kind as ever."
            ]
        }
    ];
})(window);
