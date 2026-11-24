// rw-bank.js: original Reading and Writing items for SAT Quest.
// Every passage here was written for SAT Quest. Researchers named in passages are fictional
// unless a passage states a well-documented fact. The first choice listed in each item is the
// correct one; choices are shuffled when shown. Each choice carries its own explanation.
//
// Item fields: id, skill, sub, diff, passage, stem, choices [[text, why], ...],
//              concept, misconception, strategy, stimulus (optional table)

function rw(id, skill, sub, diff, passage, stem, choices, concept, misconception, strategy, stimulus) {
  RW_BANK.push({
    id, skill, sub, diff, passage, stem, stimulus: stimulus || null,
    choices: choices.map(([t, why], i) => ({ t, ok: i === 0, why })),
    concept, misconception, strategy, source: "bank",
  });
}
const MAIN = "Which choice best states the main idea of the text?";
const CONV = "Which choice completes the text so that it conforms to the conventions of Standard English?";
const LOGIC = "Which choice completes the text with the most logical transition?";
const WORD = "Which choice completes the text with the most logical and precise word or phrase?";
const COMPLETE = "Which choice most logically completes the text?";

// ===== Information and Ideas: Central Ideas and Details =====
rw("rw-ci-1", "central", "main-idea", "medium",
  "In a study of 30 neighborhoods in one city, ecologist Lena Ortiz and her colleagues found that blocks with continuous tree canopy were, on average, about 4°C cooler on summer afternoons than nearby blocks with sparse canopy. The cooling was uneven, however. Blocks near a single large park saw little benefit beyond the park's edge, while blocks with trees spread along their streets were cooler throughout. The researchers conclude that how trees are distributed may matter as much as how many there are.",
  MAIN, [
    ["The cooling effect of urban trees appears to depend not only on their number but also on how they are arranged.", "This captures the text's conclusion: distribution may matter as much as quantity, supported by the contrast between park blocks and street-tree blocks."],
    ["Large city parks are the most effective way to reduce summer temperatures in surrounding neighborhoods.", "The text says blocks near a single large park saw little benefit beyond its edge, which contradicts this."],
    ["Urban neighborhoods are hotter in summer mainly because they lack trees along their streets.", "The text does not identify the main cause of urban heat; this overstates a causal claim."],
    ["Ortiz and her colleagues measured afternoon temperatures in 30 neighborhoods during the summer.", "This is a detail about the study's method, not the main idea the text builds toward."],
  ], "The main idea is the claim the whole text supports, often stated as a conclusion.", "Choosing a true detail instead of the overall point; choosing a claim that contradicts the text.",
  "Look for the sentence the other sentences support. Here the last sentence states the conclusion.");

rw("rw-ci-2", "central", "literary-summary", "easy",
  "Every morning, Ines unlocked the bakery an hour before her employees arrived. She did not need the time to bake; the dough had been rising since midnight. Instead, she walked between the empty tables, straightening chairs that were already straight and listening to the ovens tick as they warmed. By the time the first worker knocked, she had a list of small tasks in her head and an expression of calm she had not had when she woke.",
  "Which choice best describes what happens in the text?", [
    ["Ines uses a quiet period before work begins to settle herself and prepare for the day.", "The text describes her early, unhurried routine and ends by noting the calm she gains from it."],
    ["Ines arrives early because the bakery's dough needs her attention before dawn.", "The text says she 'did not need the time to bake,' which directly contradicts this."],
    ["Ines worries that her employees will arrive late and leave tasks unfinished.", "Nothing in the text suggests concern about her employees' punctuality."],
    ["Ines rearranges the bakery's furniture to make room for more customers.", "She straightens chairs 'that were already straight'; she is not rearranging the room."],
  ], "A literary summary describes what happens and why it matters, based only on the text.", "Inventing motives the text does not give; misreading a detail.",
  "Check each choice against specific lines. Eliminate any choice a line contradicts.");

rw("rw-ci-3", "central", "detail", "hard",
  "Historians long assumed that the scarcity of written records from rural villages in fourteenth-century England reflected low literacy. Historian Ruth Adeyemi argues that this assumption confuses survival with production. Many village agreements, she notes, were written on reused or low-quality parchment and discarded once an agreement expired, whereas the records of monasteries and royal courts were deliberately preserved in archives. The gap in the record, Adeyemi contends, may say more about which documents were kept than about who could write.",
  "According to the text, why does Adeyemi question the traditional explanation for the scarcity of rural records?", [
    ["She suggests that rural documents may have been produced but not preserved.", "This restates her distinction between 'survival' and 'production': village records were written but discarded."],
    ["She has found evidence that rural literacy was higher than literacy in monasteries.", "The text makes no comparison of literacy rates; this goes well beyond her claim."],
    ["She believes that royal court records exaggerated how many villagers could read.", "The text never says court records described villagers' literacy at all."],
    ["She argues that parchment was too expensive for most rural communities to use.", "The text says villagers did write on parchment, so this contradicts it."],
  ], "Detail questions ask what the text explicitly says, often about a person's reasoning.", "Choosing an answer that sounds like a stronger version of the claim.",
  "Find the sentence that answers 'why' directly, then pick the choice that paraphrases it without adding anything.");

// ===== Command of Evidence: Textual =====
rw("rw-ct-1", "coe-text", "support-claim", "medium",
  "Juvenile reef fish spend their first weeks drifting in open water before returning to settle on a reef. Because many of them return at night, when visual cues are limited, marine biologist Tomas Reyes hypothesizes that the fish rely mainly on sound, such as the snapping of shrimp and the calls of other fish, to locate a reef.",
  "Which finding, if true, would most directly support Reyes's hypothesis?", [
    ["In darkened tanks, juvenile fish swam toward speakers playing recorded reef sounds far more often than toward silent speakers.", "This isolates sound in darkness and shows fish moving toward it, which is exactly what the hypothesis predicts."],
    ["Juvenile fish released near reefs during the day settled faster than fish released at night.", "This compares day and night but says nothing about whether sound is the cue."],
    ["Adult reef fish produce a wider range of sounds than juvenile reef fish do.", "This is about which fish make sounds, not whether juveniles use sounds to navigate."],
    ["Juvenile fish raised in tanks showing images of reefs settled on reefs as often as wild fish did.", "This concerns visual cues, so it does not support a claim about sound."],
  ], "Supporting evidence must match the specific claim, including its key variable.", "Picking evidence on the right topic that does not test the claim.",
  "Restate the claim in a few words (here: 'fish use sound to find reefs at night'), then find the choice that shows exactly that.");

rw("rw-ct-2", "coe-text", "weaken-claim", "hard",
  "Several software firms recently tested a four-day workweek, and output per employee rose at most of them. Economist Priya Nandakumar argues that the gains occurred because employees with an extra day off returned to work better rested.",
  "Which finding, if true, would most directly weaken Nandakumar's explanation?", [
    ["At the firms in the trials, output rose by a similar amount among employees who reported no change in how rested they felt.", "If output rose just as much without any change in rest, rest cannot explain the gains, which undercuts her proposed cause."],
    ["Most employees in the trials reported feeling more rested after the four-day schedule began.", "This is consistent with her explanation; it would support it, not weaken it."],
    ["Most employees in the trials said they would prefer to keep the four-day schedule.", "Employees' preferences do not bear on why output rose."],
    ["Several firms that were not part of the trials also introduced flexible schedules.", "What other firms did says nothing about the cause of the gains at the trial firms."],
  ], "To weaken a causal explanation, show that the effect occurs without the proposed cause.", "Choosing evidence that supports the claim, or evidence that is merely irrelevant.",
  "Identify the claimed cause (being rested). The best weakener shows the effect happening without it.");

rw("rw-ct-3", "coe-text", "quotation", "hard",
  "In Sonnet 18, William Shakespeare's speaker compares the beloved to a summer's day and finds summer lacking, because summer's beauty is brief and changeable. The speaker then asserts that the beloved's beauty, unlike summer's, will not fade.",
  "Which quotation from the sonnet most effectively illustrates the speaker's assertion?", [
    ["\"But thy eternal summer shall not fade\"", "This line directly claims that the beloved's beauty ('thy eternal summer') will not fade."],
    ["\"Rough winds do shake the darling buds of May\"", "This line describes nature's flaws, which is the comparison, not the claim about the beloved's lasting beauty."],
    ["\"And summer's lease hath all too short a date\"", "This line says summer is brief; it supports the criticism of summer, not the assertion about the beloved."],
    ["\"Sometime too hot the eye of heaven shines\"", "This line criticizes the summer sun, not the beloved's beauty."],
  ], "A quotation illustrates a claim only if it states or shows that exact claim.", "Choosing a line that is related to the poem's comparison but supports a different point.",
  "Underline the exact claim in the question ('the beloved's beauty will not fade') and match it word for word.");

// ===== Command of Evidence: Quantitative =====
rw("rw-cq-1", "coe-quant", "table-claim", "medium",
  "A city planner claims that the protected bike lanes the city completed in 2017 contributed to a shift in how residents get to work. To support this claim, the planner points out that between 2015 and 2023, ______",
  COMPLETE, [
    ["the share of commuters who bicycled nearly tripled, rising from 4% to 11%.", "This uses the table accurately (4% to 11%) and is the change most directly related to bike lanes."],
    ["the share of commuters who walked rose more than the share who bicycled.", "The table shows walking rose 1 point and bicycling rose 7, so this is false."],
    ["public transit replaced the car as the most common way to commute.", "Cars remained most common (51% in 2023), so this misreads the table."],
    ["the share of commuters who used public transit rose by more than the share who bicycled.", "Transit rose 3 points and bicycling rose 7, so this is false."],
  ], "Quantitative evidence must be accurate to the data and relevant to the claim.", "Choosing a statement that misreads the table or does not relate to the claim.",
  "First eliminate choices that misstate the data. Then pick the true choice that connects to the claim.",
  { kind: "table", title: "Share of commuters by main mode of travel", head: ["Mode", "2015", "2023"], rows: [["Car", "62%", "51%"], ["Public transit", "24%", "27%"], ["Bicycle", "4%", "11%"], ["Walking", "10%", "11%"]] });

rw("rw-cq-2", "coe-quant", "table-compare", "hard",
  "Agronomist Hye-jin Park hypothesized that planting cover crops between growing seasons improves corn yields more in dry years than in wet years, because cover crops help soil retain moisture. Park compared yields on plots with and without cover crops across years with low and high rainfall.",
  "Which choice best describes data from the table that support Park's hypothesis?", [
    ["Cover crops raised yields by 16 bushels per acre in low-rainfall years but by only 3 bushels per acre in high-rainfall years.", "158 − 142 = 16 and 174 − 171 = 3: the benefit is larger in dry years, which is exactly the comparison the hypothesis makes."],
    ["Yields were higher in high-rainfall years than in low-rainfall years, whether or not cover crops were planted.", "True, but it compares rainfall levels, not the size of the cover-crop benefit in each."],
    ["Plots with cover crops in high-rainfall years had the highest yield of any group.", "True, but the hypothesis concerns where cover crops help more, not which group is highest."],
    ["Cover crops raised yields by more in high-rainfall years than in low-rainfall years.", "The table shows the reverse (3 vs. 16 bushels per acre)."],
  ], "A comparative hypothesis needs a comparison of differences, not just single values.", "Choosing a true statement that does not address the hypothesis.",
  "When a hypothesis says 'more in X than in Y', compute the effect in X and in Y and compare them.",
  { kind: "table", title: "Average corn yield (bushels per acre)", head: ["Rainfall", "No cover crop", "Cover crop"], rows: [["Low", "142", "158"], ["High", "171", "174"]] });

rw("rw-cq-3", "coe-quant", "table-claim", "easy",
  "Students counted visits by birds to two feeders over one week. Feeder A held sunflower seeds, and feeder B held millet. One student claims that, overall, the birds at the site preferred sunflower seeds.",
  "Which choice most effectively uses data from the table to support the student's claim?", [
    ["Feeder A received 103 visits in total, compared with 83 for feeder B.", "Totals compare all birds' choices, which is what 'overall' requires, and they favor feeder A."],
    ["Sparrows visited feeder B 41 times and feeder A 20 times.", "This favors millet, so it weakens the claim."],
    ["Finches visited the two feeders a similar number of times.", "A near-tie shows no preference, so it does not support the claim."],
    ["Chickadees visited feeder B 12 times.", "A single number with no comparison cannot show a preference."],
  ], "Match the scope of the data to the scope of the claim.", "Using one category's data for an 'overall' claim.",
  "Words like 'overall' point you to totals.",
  { kind: "table", title: "Bird visits in one week", head: ["Species", "Feeder A (sunflower)", "Feeder B (millet)"], rows: [["Chickadee", "48", "12"], ["Finch", "35", "30"], ["Sparrow", "20", "41"], ["Total", "103", "83"]] });

// ===== Inferences =====
rw("rw-in-1", "infer", "logical-completion", "medium",
  "Paleontologists have found fossilized pollen from one genus of flowering plant in rock layers dated to about 125 million years ago, both in what is now Portugal and in what is now China. Because pollen of this genus is heavy and is not easily carried long distances by wind, the finding suggests that ______",
  COMPLETE, [
    ["the genus had already spread across a wide geographic area by about 125 million years ago.", "If the pollen could not travel far, its presence in two distant places implies the plants themselves grew in both places."],
    ["the genus first evolved in what is now Portugal and later spread to what is now China.", "The text gives no information about where the genus originated or in what order it spread."],
    ["wind was the main way the genus's pollen was dispersed.", "The text says the pollen is not easily carried by wind, so this contradicts it."],
    ["the rock layers in Portugal and China were formed by the same geological event.", "The text dates the layers but says nothing about how they formed."],
  ], "An inference must follow from the text's facts without adding new assumptions.", "Adding a sequence or cause the text does not support.",
  "Ask what must be true if every sentence in the text is true.");

rw("rw-in-2", "infer", "logical-completion", "hard",
  "In a laboratory study, psychologist Amara Lindqvist told one group of participants that a puzzle measured intelligence and told another group that it was simply a game. The puzzles were identical, yet participants in the first group spent less time working on it. Participants in the first group were also more likely to say afterward that the puzzle was 'not worth the effort.' Taken together, these findings suggest that ______",
  COMPLETE, [
    ["describing a task as a measure of ability may lead some people to put less effort into it and to downplay its importance.", "Both findings point the same way: less time spent and more statements that it was not worth the effort, after an ability framing."],
    ["participants told the puzzle was a game solved it more accurately than the other participants did.", "The text reports time spent and opinions, not accuracy."],
    ["most participants found the puzzle too difficult to complete.", "Nothing in the text reports how many participants completed the puzzle."],
    ["people generally prefer games to tasks that are described as tests.", "This is far broader than the study, which measured time and one opinion in a single experiment."],
  ], "Combine all the evidence; the inference must account for each finding.", "Overgeneralizing; introducing a measure (accuracy) the study did not report.",
  "'Taken together' means the answer must use both findings.");

rw("rw-in-3", "infer", "logical-completion", "easy",
  "Glaciologists measuring a glacier in the Andes found that its front edge retreated about 40 meters per year from 2000 to 2010 and about 65 meters per year from 2010 to 2020. Average air temperatures over the glacier rose during both decades, and more quickly in the second. These observations are consistent with the idea that ______",
  COMPLETE, [
    ["the glacier's retreat sped up as temperatures rose more quickly.", "Both the retreat rate and the warming rate were higher in the second decade, so the observations fit this idea."],
    ["the glacier will disappear completely before 2030.", "The text gives no basis for predicting a date."],
    ["the glacier advanced during the second decade.", "The text says it retreated faster, not that it advanced."],
    ["air temperature has no effect on how quickly a glacier retreats.", "The observations show the two changing together, which does not fit this claim."],
  ], "'Consistent with' asks which idea the data fit, not what they prove.", "Making predictions the data cannot support.",
  "Line up the numbers: what rose, and when?");

// ===== Craft and Structure: Words in Context =====
rw("rw-wc-1", "wic", "precise-word", "easy",
  "The committee's final report was notably ______: in fewer than ten pages, it summarized three years of testimony without leaving out any major finding.",
  WORD, [
    ["concise", "'Fewer than ten pages' for three years of testimony, with nothing major left out, describes brevity that keeps the substance: concise."],
    ["elaborate", "Elaborate means detailed and lengthy, the opposite of fewer than ten pages."],
    ["tentative", "Nothing suggests the report was uncertain or hesitant."],
    ["partisan", "The text says nothing about the report favoring one side."],
  ], "The words after the colon define or illustrate the missing word.", "Picking a word that sounds academic but does not fit the context clue.",
  "Predict your own word from the clue before looking at the choices.");

rw("rw-wc-2", "wic", "precise-word", "medium",
  "Although critics at first dismissed the novelist's spare prose as unpolished, later scholars argued that its plainness was ______, a deliberate choice meant to mirror the restraint of the book's characters.",
  WORD, [
    ["calculated", "'A deliberate choice' defines the blank: the plainness was intentional, or calculated."],
    ["accidental", "This matches the early critics' view, but the sentence says later scholars saw it as deliberate."],
    ["ornate", "Ornate means highly decorated, which contradicts 'spare' and 'plainness.'"],
    ["derivative", "Derivative means copied from others; the sentence is about intention, not originality."],
  ], "Contrast words ('Although') signal that the blank opposes an earlier idea.", "Choosing the word that fits the view being contrasted.",
  "Find the definition clue (here, after the comma) and the contrast signal.");

rw("rw-wc-3", "wic", "word-meaning", "medium",
  "The drug did not reverse the damage already done to patients' nerve cells, but in most participants it arrested the disease's progress for the eighteen months of the trial, a result the researchers described as modest but meaningful.",
  "As used in the text, what does the word \"arrested\" most nearly mean?", [
    ["halted", "The drug did not reverse damage but stopped further progress; 'halted' fits."],
    ["detained", "This is the familiar sense of 'arrested' (by police), which does not fit a disease's progress."],
    ["attracted", "'Arrested attention' means attracted it, but a drug does not attract a disease's progress."],
    ["accelerated", "This is the opposite: the result is described as positive, so the drug did not speed the disease up."],
  ], "Common words can have less common meanings; context decides.", "Choosing the most familiar meaning of the word.",
  "Replace the word with each choice and reread the sentence.");

rw("rw-wc-4", "wic", "precise-word", "hard",
  "Historian Kwame Mensah argues that the treaty's significance has been ______: although it is often described as a turning point, its terms largely formalized trade arrangements that had been in place for decades.",
  WORD, [
    ["overstated", "If the treaty mostly formalized existing arrangements, calling it a turning point exaggerates its importance."],
    ["overlooked", "The treaty is 'often described as a turning point,' so its significance has been emphasized, not overlooked."],
    ["undisputed", "Mensah is disputing the usual view, so it is not undisputed."],
    ["misdated", "The argument concerns importance, not the date."],
  ], "The clause after the colon explains the word before it.", "Choosing a word with the right tone ('negative') but the wrong direction.",
  "Ask: is the author saying the thing is more or less important than people think?");

// ===== Text Structure and Purpose =====
rw("rw-ts-1", "tsp", "overall-structure", "medium",
  "Because octopuses live mostly alone and rarely interact with their parents, many researchers assumed that they could not learn by watching others. In a study led by biologist Elif Kaya, however, octopuses that had observed another octopus open a sealed jar later opened the jar more quickly, on average, than octopuses that had not. Kaya cautions that the study involved a single task, but she suggests that the assumption may need to be reexamined.",
  "Which choice best describes the overall structure of the text?", [
    ["It presents a common assumption, describes a finding that calls it into question, and notes a limitation of that finding.", "Sentence 1: assumption. Sentence 2: contrary finding ('however'). Sentence 3: limitation ('a single task')."],
    ["It describes an experiment, explains why its results were flawed, and proposes a better design.", "The text notes a limitation but never calls the results flawed or proposes a new design."],
    ["It compares two theories of animal learning and argues that one is better supported.", "Only one assumption is discussed; no two theories are compared."],
    ["It explains how octopuses open jars and why this ability is rare among animals.", "The text does not explain how octopuses open jars or compare them with other animals."],
  ], "Structure questions describe what each part of the text does, in order.", "Choosing a structure with one step the text does not contain.",
  "Label each sentence with its job, then match the sequence.");

rw("rw-ts-2", "tsp", "sentence-function", "easy",
  "The architect designed the library around a single principle: readers should never be more than a few steps from natural light. [u]Every reading table sits beside a window, and the central stacks are lit by a glass roof.[/u] Even the basement study rooms open onto a sunken garden.",
  "Which choice best describes the function of the underlined sentence in the text as a whole?", [
    ["It gives specific examples of how the design principle was carried out.", "Tables by windows and a glass roof are concrete applications of 'never more than a few steps from natural light.'"],
    ["It introduces a principle that the rest of the text questions.", "The principle is introduced in the first sentence, and nothing questions it."],
    ["It describes a problem that the architect failed to solve.", "The sentence shows success, not failure."],
    ["It shifts the focus from the library's design to its history.", "The sentence stays on design; there is no history."],
  ], "A sentence's function is its relationship to the sentences around it.", "Describing the sentence's content instead of its role.",
  "Ask how the sentence connects to the main claim: example, contrast, cause, or conclusion?");

rw("rw-ts-3", "tsp", "main-purpose", "hard",
  "The letter had been folded so many times that its creases had worn through in places, and Tomas held it the way one holds a moth, as though too firm a grip might end it. He did not read it again. He knew what it said. He set it on the table, smoothed it once with the side of his hand, and went to make the coffee.",
  "Which choice best states the main purpose of the text?", [
    ["To convey, through a character's careful handling of an object, how much that object means to him", "The worn creases, the moth comparison, and the gentle smoothing all show the letter's emotional weight."],
    ["To explain why Tomas has decided not to reply to the letter", "The text never mentions replying or a decision about it."],
    ["To describe the steps Tomas follows every morning", "Nothing indicates this is a daily routine; the focus is on the letter."],
    ["To suggest that Tomas has forgotten what the letter says", "The text states 'He knew what it said,' which contradicts this."],
  ], "In literary texts, purpose is often conveyed through action and imagery rather than stated directly.", "Choosing a purpose based on a detail the text does not include.",
  "Ask what the details have in common: here, care and fragility.");

// ===== Cross-Text Connections =====
rw("rw-cx-1", "ctc", "response", "hard",
  "Text 1\nSome linguists argue that children acquire grammar mainly by detecting statistical patterns in the speech they hear. On this view, no specialized, inborn knowledge of grammar is needed: exposure to enough language is sufficient.\n\nText 2\nLinguist Daniela Ferrer studied deaf children who had no exposure to a signed language and who developed their own gesture systems at home. These systems showed consistent word order and other grammatical regularities that did not appear in the gestures of the children's hearing parents. Ferrer argues that such findings are difficult to explain if children learn grammar only from the input they receive.",
  "Based on the texts, how would Ferrer (Text 2) most likely respond to the view described in Text 1?", [
    ["She would argue that it cannot fully account for grammatical structure that children produce without having encountered it in their input.", "Her evidence is children creating regularities their parents did not use, which input-only learning cannot easily explain."],
    ["She would agree with it, since the children in her study learned grammar from their parents' gestures.", "The text says the regularities did not appear in the parents' gestures, so this contradicts her findings."],
    ["She would argue that statistical learning plays no role at all in how children acquire language.", "She says input-only learning is 'difficult' to reconcile with her findings, not that statistics play no role. This is too extreme."],
    ["She would claim that the view applies to spoken languages but not to signed languages.", "She does not divide languages this way; her point concerns learning without input."],
  ], "Cross-text questions ask how one author's evidence bears on the other's claim.", "Choosing an extreme version of the author's position.",
  "Summarize each text in one line, then ask: does Text 2's evidence support, challenge, or qualify Text 1?");

rw("rw-cx-2", "ctc", "response", "medium",
  "Text 1\nA two-year study of a large customer-service company found that employees who worked from home handled 11 percent more calls per shift than employees who worked in the office. The study's authors conclude that remote work increases productivity.\n\nText 2\nEconomist Lauren Whitfield notes that much research on remote work relies on outputs that are easy to count, such as calls answered or tickets closed. Such measures, she argues, may miss the informal exchanges among coworkers that help generate new ideas, effects that may take years to appear.",
  "Based on the texts, how would Whitfield (Text 2) most likely respond to the conclusion in Text 1?", [
    ["She would caution that the study's measure of productivity may not capture some important effects of remote work.", "Calls per shift is an easily counted output, exactly the kind of measure she says can miss collaboration effects."],
    ["She would reject the finding that remote employees handled more calls.", "She questions what the measure captures, not whether the count is accurate."],
    ["She would argue that customer-service work is better done in an office.", "She makes no claim about which setting suits customer service."],
    ["She would agree that remote work increases productivity in every type of job.", "Her point is a caution, and 'every type of job' is far broader than either text."],
  ], "An author can challenge a conclusion by questioning how something was measured.", "Assuming disagreement means rejecting the data itself.",
  "Look for the specific weakness Text 2 names, then see whether Text 1's study has it.");

// ===== Expression of Ideas: Rhetorical Synthesis =====
rw("rw-rs-1", "synth", "notes-goal", "medium",
  "While researching a topic, a student has taken the following notes:\n• The Svalbard Global Seed Vault is a facility in Norway that stores seed samples.\n• It opened in 2008.\n• It holds duplicate samples deposited by seed banks around the world.\n• If a seed bank loses its own collection, it can recover seeds from its duplicates in the vault.",
  "The student wants to explain the purpose of the Svalbard Global Seed Vault. Which choice most effectively uses relevant information from the notes to accomplish this goal?", [
    ["By storing duplicate samples from seed banks worldwide, the Svalbard Global Seed Vault allows a seed bank that loses its collection to recover it.", "This explains what the vault is for (a backup that allows recovery), which is the stated goal."],
    ["The Svalbard Global Seed Vault, a facility in Norway, opened in 2008.", "Location and opening date are accurate but do not explain the purpose."],
    ["Seed banks around the world store seed samples, some of which are duplicated.", "This does not mention the vault or why duplicates matter."],
    ["In 2008, a facility that stores seed samples opened in Norway.", "This describes the vault but not its purpose."],
  ], "Rhetorical synthesis: choose the sentence that meets the stated goal, using only the notes.", "Choosing an accurate sentence that does not meet the goal.",
  "Read the goal first and ignore the notes until you know what the sentence must do.");

rw("rw-rs-2", "synth", "notes-goal", "hard",
  "While researching a topic, a student has taken the following notes:\n• Refracting telescopes use lenses to focus light.\n• Reflecting telescopes use mirrors to focus light.\n• A large lens can be supported only around its edges, so it can sag under its own weight.\n• A mirror can be supported across its entire back, so it can be made much larger without sagging.\n• Most of the world's largest telescopes are reflecting telescopes.",
  "The student wants to explain why the largest telescopes tend to be reflecting rather than refracting telescopes. Which choice most effectively uses relevant information from the notes to accomplish this goal?", [
    ["Because a mirror can be supported across its entire back while a large lens can be supported only at its edges, reflecting telescopes can be built much larger without sagging.", "This gives the reason (support and sagging) and connects it to size, explaining the 'why.'"],
    ["Refracting telescopes use lenses, while reflecting telescopes use mirrors to focus light.", "This states the difference but not why it matters for size."],
    ["Most of the world's largest telescopes are reflecting telescopes, which use mirrors.", "This restates the fact to be explained without explaining it."],
    ["A large lens, like those used in refracting telescopes, can sag under its own weight.", "This explains a limit of lenses but not why mirrors avoid it, so the explanation is incomplete."],
  ], "An explanation goal requires a reason, not just a restatement or a contrast.", "Choosing a choice that is half the explanation.",
  "For 'explain why', look for 'because', 'so', or 'since' connecting the reason to the result.");

rw("rw-rs-3", "synth", "notes-goal", "easy",
  "While researching a topic, a student has taken the following notes:\n• Sea otters live in coastal waters of the North Pacific Ocean.\n• Sea otters eat sea urchins, which feed on kelp; by limiting urchin numbers, otters help kelp forests survive.\n• Beavers live in rivers and streams in North America and Eurasia.\n• Beavers build dams that turn streams into ponds, creating habitat for many other species.",
  "The student wants to emphasize a similarity between sea otters and beavers. Which choice most effectively uses relevant information from the notes to accomplish this goal?", [
    ["Both sea otters and beavers reshape their environments: otters protect kelp forests by eating urchins, and beavers create ponds by building dams.", "This names a shared trait (reshaping habitats) and supports it with one example for each animal."],
    ["Sea otters live in the coastal North Pacific, whereas beavers live in rivers and streams.", "'Whereas' signals a difference, not a similarity."],
    ["Beavers build dams that turn streams into ponds.", "This describes only one animal."],
    ["Sea otters eat sea urchins, which feed on kelp.", "This describes only one animal."],
  ], "A comparison goal requires both subjects and a shared feature.", "Choosing a sentence about only one subject.",
  "Check that the choice mentions both things and uses language of similarity.");

// ===== Transitions =====
rw("rw-tr-1", "trans", "contrast", "easy",
  "Early bicycles with a very large front wheel could reach high speeds on smooth roads. ______ they were hard to mount and dangerous on rough ground, since a rider who stopped suddenly could be thrown over the handlebars.",
  LOGIC, [
    ["However,", "The second sentence gives drawbacks that contrast with the advantage in the first."],
    ["For instance,", "The second sentence is not an example of high speed."],
    ["Similarly,", "The sentences describe opposite qualities, not similar ones."],
    ["Therefore,", "Danger does not result from high speed on smooth roads, so there is no cause and effect."],
  ], "Transitions show the logical relationship between ideas.", "Choosing a transition by its sound instead of its logic.",
  "Decide the relationship (contrast, cause, example, addition) before reading the choices.");

rw("rw-tr-2", "trans", "cause-effect", "medium",
  "Engineers discovered that the bridge's original steel cables had corroded far more quickly than predicted. ______ the city closed the bridge to heavy trucks while replacement cables were made.",
  LOGIC, [
    ["Consequently,", "Closing the bridge to trucks is a result of discovering the corrosion."],
    ["Nevertheless,", "This signals an unexpected outcome despite the first sentence, but closing the bridge is the expected response."],
    ["Likewise,", "The second sentence is not a similar situation; it is a response."],
    ["In other words,", "The second sentence does not restate the first."],
  ], "Cause-and-effect transitions link a situation to its result.", "Choosing a contrast word when the second idea is a consequence.",
  "Ask: does the second sentence happen because of the first?");

rw("rw-tr-3", "trans", "contrast", "hard",
  "Historians once believed that the ancient city was abandoned suddenly, perhaps after an invasion. Recent excavations, ______ point to a gradual decline: houses were emptied one by one over nearly a century, and many doorways were carefully sealed.",
  LOGIC, [
    ["however,", "Gradual decline contrasts with the earlier belief in sudden abandonment."],
    ["for example,", "The excavations are not an example of sudden abandonment; they contradict it."],
    ["moreover,", "'Moreover' adds a supporting point, but the excavations challenge the earlier belief."],
    ["therefore,", "The excavations' findings do not follow from the old belief."],
  ], "A transition in the middle of a sentence still connects it to the previous sentence.", "Being misled by the transition's position inside the sentence.",
  "Mentally move the transition to the front of its sentence.");

rw("rw-tr-4", "trans", "sequence", "medium",
  "The first step in restoring the fresco was to remove centuries of soot from its surface. ______ conservators filled small cracks in the plaster with a lime-based paste chosen to match the original.",
  LOGIC, [
    ["Next,", "'The first step' sets up a sequence, and filling cracks is the following step."],
    ["Instead,", "The second step is not a replacement for the first."],
    ["Even so,", "Nothing in the first sentence makes the second surprising."],
    ["In contrast,", "The two steps are parts of one process, not opposites."],
  ], "Sequence transitions order steps in a process.", "Missing the clue word 'first'.",
  "Clue words like 'first' or 'initially' often call for a sequence transition.");

rw("rw-tr-5", "trans", "emphasis", "hard",
  "Most species of bamboo flower only at long intervals, often several decades apart. ______ some species are known to flower only about once every 120 years.",
  LOGIC, [
    ["Indeed,", "The second sentence intensifies the first: 120 years is an extreme case of long intervals."],
    ["By contrast,", "The second sentence does not contradict the first; it strengthens it."],
    ["As a result,", "Some species' long intervals are not caused by most species' long intervals."],
    ["Still,", "'Still' signals a concession, but nothing is being conceded."],
  ], "Emphasis transitions ('indeed', 'in fact') introduce a stronger version of the previous point.", "Treating a more extreme example as a contrast.",
  "If the second sentence pushes the same idea further, look for 'indeed' or 'in fact'.");

// ===== Standard English Conventions: Boundaries =====
rw("rw-bd-1", "bound", "comma-splice", "easy",
  "The museum's new wing will house the city's collection of early ______ many of these images have never been exhibited before.",
  CONV, [
    ["photographs;", "Both sides are complete sentences, and a semicolon correctly joins two independent clauses."],
    ["photographs,", "A comma alone cannot join two independent clauses; this is a comma splice."],
    ["photographs", "With no punctuation, two independent clauses run together: a run-on."],
    ["photographs, which", "'Which many of these images have never been exhibited' is not grammatical."],
  ], "Two independent clauses need a period, a semicolon, or a comma plus a conjunction.", "Comma splices.",
  "Cover the punctuation and check whether each side could stand alone as a sentence.");

rw("rw-bd-2", "bound", "colon", "medium",
  "The recipe's success depends on a single ______ the butter must stay cold enough to remain in solid pieces as the dough is folded.",
  CONV, [
    ["condition:", "A colon after a complete clause introduces an explanation of 'a single condition.'"],
    ["condition,", "This creates a comma splice between two independent clauses."],
    ["condition", "This is a run-on with no boundary between the clauses."],
    ["condition; that", "After the semicolon, 'that the butter must stay cold...' is a fragment."],
  ], "A colon follows a complete clause and introduces an explanation or a list.", "Using a comma where a stronger boundary is needed.",
  "If the first part sets something up ('a single condition') and the second explains it, a colon fits.");

rw("rw-bd-3", "bound", "supplement", "medium",
  "The chemist Marie ______ was the first person to win Nobel Prizes in two different sciences.",
  CONV, [
    ["Curie, who was born in Warsaw,", "A nonessential clause is set off by a comma on each side."],
    ["Curie who was born in Warsaw,", "The clause needs an opening comma to match the closing one."],
    ["Curie, who was born in Warsaw", "The clause needs a closing comma before the verb 'was.'"],
    ["Curie—who was born in Warsaw,", "A supplement must open and close with the same punctuation mark."],
  ], "Nonessential information is enclosed by matching punctuation: two commas, two dashes, or two parentheses.", "Mismatched or missing commas around a supplement.",
  "Remove the supplement: the sentence that remains should be complete and correctly punctuated.");

rw("rw-bd-4", "bound", "supplement", "hard",
  "The ______ was published in 1818, when its author, Mary Shelley, was twenty years old.",
  CONV, [
    ["novel Frankenstein", "The title identifies which novel is meant, so it is essential and takes no commas."],
    ["novel Frankenstein,", "A comma should not separate the subject from its verb."],
    ["novel, Frankenstein,", "Commas would mark the title as nonessential, as if 'the novel' alone already identified a single novel."],
    ["novel, Frankenstein", "A single comma separates the subject phrase from itself; there is no closing comma."],
  ], "Essential information (needed to identify the noun) is not set off by commas.", "Adding commas around every name or title.",
  "Ask whether the sentence would still identify the right thing without the name. If not, no commas.");

rw("rw-bd-5", "bound", "subordination", "hard",
  "Although the world's first commercial jet airliner entered passenger service in ______ of these aircraft were grounded within two years after a series of accidents.",
  CONV, [
    ["1952, several", "An introductory dependent clause ('Although...') is followed by a comma before the main clause."],
    ["1952; several", "A semicolon must join two independent clauses, and the 'Although' clause is dependent."],
    ["1952. Several", "This leaves 'Although ... 1952.' as a sentence fragment."],
    ["1952 several", "Without a comma, the dependent clause runs into the main clause."],
  ], "A dependent clause joined to an independent clause uses a comma, not a semicolon or a period.", "Using a semicolon after a dependent clause.",
  "Words like 'although', 'because', and 'when' make a clause dependent.");

rw("rw-bd-6", "bound", "coord-conj", "medium",
  "Honeybees communicate the location of food through a movement called the waggle ______ the angle of the dance indicates the food's direction relative to the sun.",
  CONV, [
    ["dance, and", "Two independent clauses joined by a coordinating conjunction need a comma before the conjunction."],
    ["dance and,", "The comma belongs before 'and', not after it."],
    ["dance,", "A comma alone between two independent clauses is a comma splice."],
    ["dance, and,", "No comma follows the conjunction here."],
  ], "Comma + coordinating conjunction (and, but, so, or, yet) joins two independent clauses.", "Misplacing the comma around 'and'.",
  "Comma goes before FANBOYS when both sides are full sentences.");

rw("rw-bd-7", "bound", "semicolon", "hard",
  "The bridge was designed to sway slightly in strong ______ engineers were not alarmed by the movement reported during the storm.",
  CONV, [
    ["winds; therefore,", "'Therefore' is not a conjunction, so the two clauses need a semicolon, and 'therefore' takes a comma after it."],
    ["winds, therefore,", "A comma cannot join two independent clauses, even with 'therefore': this is a comma splice."],
    ["winds therefore,", "This is a run-on: there is no boundary between the clauses."],
    ["winds, therefore;", "The semicolon is in the wrong place; it must come before 'therefore'."],
  ], "Conjunctive adverbs (therefore, however) cannot join clauses on their own.", "Treating 'therefore' or 'however' like 'and'.",
  "If you could swap the word for 'and', a comma might work. You can't swap 'therefore', so use a semicolon.");

rw("rw-bd-8", "bound", "run-on", "easy",
  "The volunteers planted more than two hundred trees along the ______ the city plans to add benches next spring.",
  CONV, [
    ["river. Next,", "A period separates the two independent clauses, and 'Next' begins the new sentence."],
    ["river next,", "This runs two independent clauses together without a boundary."],
    ["river, next", "A comma alone cannot separate two independent clauses."],
    ["river next", "This is a run-on sentence."],
  ], "Each independent clause must be separated by a proper boundary.", "Run-on sentences.",
  "Read the sentence aloud: if it has two complete thoughts, it needs a period, semicolon, or comma + conjunction.");

// ===== Standard English Conventions: Form, Structure, and Sense =====
rw("rw-fs-1", "fss", "sva", "medium",
  "The results of the survey, which was distributed to more than four thousand households across the region, ______ that most residents support expanding the bus network.",
  CONV, [
    ["indicate", "The subject is 'results' (plural), so the verb is plural: indicate."],
    ["indicates", "This agrees with 'survey' or 'region', which are inside modifying phrases, not the subject."],
    ["has indicated", "'Has' is singular and does not agree with 'results.'"],
    ["was indicating", "'Was' is singular, and the tense also does not fit a current finding."],
  ], "The verb agrees with its subject, not with a noun inside a phrase in between.", "Agreeing with the nearest noun.",
  "Cross out the phrase between commas and find the subject.");

rw("rw-fs-2", "fss", "pronoun-agree", "medium",
  "Although the coral reefs near the island have been damaged by rising water temperatures, ______ still support hundreds of species of fish.",
  CONV, [
    ["they", "The pronoun refers to 'reefs' (plural), so 'they' agrees."],
    ["it", "'It' is singular and cannot refer to 'reefs'."],
    ["this", "'This' is singular and vague; it does not agree with 'support'."],
    ["one", "'One' is singular and does not refer clearly to the reefs."],
  ], "A pronoun agrees in number with the noun it replaces.", "Using a singular pronoun for a plural noun.",
  "Find the noun the pronoun replaces, then check its number.");

rw("rw-fs-3", "fss", "pronoun-case", "easy",
  "The grant committee invited Dr. Osei and ______ to present the findings at the annual meeting.",
  CONV, [
    ["me", "The pronoun is an object of 'invited', so the object form 'me' is correct."],
    ["I", "'I' is a subject pronoun; 'invited I' is incorrect."],
    ["myself", "Reflexive pronouns are used only when the subject acts on itself."],
    ["mine", "'Mine' is possessive and does not fit."],
  ], "Use object pronouns (me, him, her, us, them) after verbs and prepositions.", "Using 'I' in compound objects because it sounds formal.",
  "Remove 'Dr. Osei and': 'invited me' is clearly right.");

rw("rw-fs-4", "fss", "tense", "medium",
  "The transcontinental railroad in the United States was completed in 1869. A journey across the country that once ______ several months could then be made in about a week.",
  CONV, [
    ["had taken", "The months-long journey happened before the completion (itself past), so the past perfect fits."],
    ["takes", "Present tense does not fit a historical comparison."],
    ["will take", "Future tense contradicts 'once'."],
    ["has taken", "Present perfect connects to the present, but the time frame is entirely in the past."],
  ], "Past perfect (had + verb) shows an action completed before another past time.", "Using present or present perfect in a past narrative.",
  "Look for time clues like 'once', 'by then', or dates.");

rw("rw-fs-5", "fss", "modifier", "hard",
  "Built in the 1880s to carry water to the growing city, ______",
  CONV, [
    ["the aqueduct was later converted into an elevated walking path.", "The aqueduct is what was built in the 1880s, so it must come right after the modifier."],
    ["engineers later converted the aqueduct into an elevated walking path.", "This says the engineers were built in the 1880s: a dangling modifier."],
    ["an elevated walking path was later created from the aqueduct.", "This says the walking path was built in the 1880s to carry water."],
    ["the city later converted the aqueduct into an elevated walking path.", "This says the city was built to carry water to the growing city."],
  ], "An introductory modifier describes the noun that comes right after the comma.", "Dangling modifiers.",
  "Ask 'Who or what was built in the 1880s?' That noun must follow the comma.");

rw("rw-fs-6", "fss", "parallel", "medium",
  "The training program teaches volunteers to identify common birds, to record their observations accurately, and ______",
  CONV, [
    ["to submit their data to the national database.", "This matches the 'to + verb' form of the other two items in the list."],
    ["submitting their data to the national database.", "'Submitting' breaks the pattern of 'to identify' and 'to record'."],
    ["their data should be submitted to the national database.", "A full clause does not match the list's infinitive phrases."],
    ["the submission of their data to the national database.", "A noun phrase does not match the other items."],
  ], "Items in a list must share the same grammatical form.", "Switching forms partway through a list.",
  "Line up the list items and make the last one match the first.");

rw("rw-fs-7", "fss", "comparison", "hard",
  "The average lifespan of a human red blood cell is about 120 days, considerably longer than ______",
  CONV, [
    ["that of a platelet.", "The sentence compares lifespans, so the second item must also be a lifespan: 'that of a platelet.'"],
    ["a platelet.", "This compares a lifespan with a platelet itself, an illogical comparison."],
    ["platelets.", "This also compares a lifespan with cells, not with their lifespan."],
    ["those of a platelet.", "'Those' is plural, but it stands for 'lifespan', which is singular."],
  ], "Compare like with like: a lifespan with a lifespan.", "Illogical comparisons.",
  "Ask what is being compared, then check that both sides are the same kind of thing.");

rw("rw-fs-8", "fss", "possessive", "medium",
  "Both ______ designs were selected for the final round of the competition.",
  CONV, [
    ["architects'", "'Both' signals more than one architect; the plural possessive is architects'."],
    ["architect's", "This is singular possessive, but 'both' requires plural."],
    ["architects", "Without an apostrophe, this is a plural noun, not a possessive."],
    ["architects's", "This form is not standard for a plural ending in -s."],
  ], "Plural possessive: add an apostrophe after the -s.", "Confusing singular and plural possessives.",
  "Decide singular or plural first, then whether ownership is shown.");

rw("rw-fs-9", "fss", "plural", "easy",
  "Researchers measured the ______ of the trees in the grove twice a year to track how quickly they grew.",
  CONV, [
    ["heights", "A plain plural noun is needed: the trees have heights."],
    ["height's", "This is singular possessive; nothing is owned by the heights."],
    ["heights'", "This is plural possessive; nothing follows that the heights own."],
    ["heights's", "This is not a standard form."],
  ], "Plurals take -s with no apostrophe unless they show ownership.", "Adding apostrophes to plain plurals.",
  "If no noun follows that belongs to the word, you probably don't need an apostrophe.");

rw("rw-fs-10", "fss", "determiner", "medium",
  "The team tested the prototype on ______ different surfaces: wet pavement, gravel, packed snow, and sand.",
  CONV, [
    ["four", "The list names four surfaces, and a number is the precise determiner for a countable plural noun."],
    ["much", "'Much' is used with uncountable nouns, and 'surfaces' is countable."],
    ["a", "'A' is singular, but 'surfaces' is plural."],
    ["every", "'Every' takes a singular noun ('every surface')."],
  ], "Determiners must agree with countable/uncountable and singular/plural nouns.", "Using 'much' or 'every' with plural count nouns.",
  "Check the noun after the blank: singular or plural? countable or not?");

rw("rw-fs-11", "fss", "sva", "easy",
  "Each of the bridges in the historic district ______ been inspected within the past year.",
  CONV, [
    ["has", "'Each' is the singular subject, so the verb is singular."],
    ["have", "This agrees with 'bridges', which is inside the phrase 'of the bridges', not the subject."],
    ["are", "'Are been' is not a valid verb form."],
    ["were", "'Were been' is not a valid verb form."],
  ], "'Each', 'every', and 'one' are singular subjects.", "Agreeing with the noun in an 'of' phrase.",
  "Cross out 'of the bridges'.");

rw("rw-fs-12", "fss", "tense", "hard",
  "By the time the expedition reached the summit, the climbers ______ for nearly eleven hours without rest.",
  CONV, [
    ["had been climbing", "An action continuing up to a past moment ('By the time... reached') takes the past perfect progressive."],
    ["have been climbing", "Present perfect progressive connects to the present, but the moment is in the past."],
    ["are climbing", "Present tense conflicts with 'reached'."],
    ["climb", "Simple present conflicts with the past time frame."],
  ], "'By the time + past tense' calls for the past perfect.", "Using present perfect for past events.",
  "Find the anchor verb ('reached') and put the earlier action one step further back.");
