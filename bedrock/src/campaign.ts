// The Frozen campaign script: chapter conversations, everyday lines, trades and endings. Pure data.
import type { Conversation, StoryState } from "./conversation-logic.ts";

const NICE = 1;
const GREAT = 2;

/** Chapter conversations: CAMPAIGN[chapterId][npcName]. Finishing one with the chapter's goal character completes it. */
export const CAMPAIGN: Record<string, Record<string, Conversation>> = {
	coronation: {
		anna: {
			start: "hi",
			nodes: {
				hi: {
					speaker: "Anna",
					text: "Hi! Oh, hi! I'm Anna. Princess Anna. Of Arendelle. It's coronation day, and for the first time in forever, the gates are open!",
					choices: [
						{ text: "Nice to meet you, Princess.", next: "elsa", effects: { rel: { anna: NICE }, remember: "Anna" } },
						{ text: "You look like you just woke up.", next: "tease", effects: { flags: ["teased_anna"] } },
						{ text: "Why were the gates ever closed?", next: "gates" },
					],
				},
				tease: {
					speaker: "Anna",
					text: "What? Is there drool? ...Okay, fair. I did just wake up. Big day!",
					choices: [{ text: "Tell me about today.", next: "elsa" }],
				},
				gates: {
					speaker: "Anna",
					text: "Elsa, my sister. She shut me out years ago and I never knew why. Today she becomes queen. Maybe things will change.",
					choices: [
						{ text: "I'm sure she loves you.", next: "elsa", effects: { rel: { anna: NICE, elsa: NICE }, remember: "Anna" } },
						{ text: "Sounds lonely.", next: "elsa" },
					],
				},
				elsa: {
					speaker: "Anna",
					text: "Oh! And I met the most amazing prince at the docks. Hans, of the Southern Isles! He's in the courtyard. You have to meet him!",
					choices: [
						{ text: "I'll go find Hans." },
						{ text: "Slow down. You just met him.", next: "warned", effects: { flags: ["warned_anna"], rel: { anna: NICE } } },
					],
				},
				warned: {
					speaker: "Anna",
					text: "It's not like that! ...Okay, it's a little like that. Just meet him, you'll see!",
				},
			},
		},
	},
	open_door: {
		hans: {
			start: "hi",
			nodes: {
				hi: {
					speaker: "Hans",
					text: "Ah, a guest of Arendelle! Prince Hans of the Southern Isles. Thirteenth in line for my own throne, so... not likely.",
					choices: [
						{ text: "Anna seems quite taken with you.", next: "anna" },
						{ text: "Thirteen brothers? Must be hard to get noticed.", next: "brothers" },
						{ text: "What brings you to Arendelle?", next: "trade" },
					],
				},
				anna: {
					speaker: "Hans",
					text: "And I with her! It's as if we finish each other's—",
					choices: [
						{ text: "Sandwiches?", next: "duet", effects: { rel: { hans: NICE }, flags: ["trusted_hans"], remember: "Hans" } },
						{ text: "Sentences. Everyone says that.", next: "coronation", effects: { flags: ["doubted_hans"] } },
					],
				},
				duet: {
					speaker: "Hans",
					text: "That's what I was going to say! Love really is an open door.",
					choices: [{ text: "...", next: "coronation" }],
				},
				brothers: {
					speaker: "Hans",
					text: "Three of them pretended I was invisible. Literally. For two years. That's what brothers do.",
					choices: [
						{ text: "That's awful. Anna will be good to you.", next: "coronation", effects: { rel: { hans: NICE }, flags: ["trusted_hans"] } },
						{ text: "So marrying a princess is your ticket to a crown?", next: "suspect", effects: { flags: ["doubted_hans"], remember: "Hans" } },
					],
				},
				suspect: {
					speaker: "Hans",
					text: "What? No! How could you... I love her. Truly.",
					choices: [{ text: "We'll see.", next: "coronation" }],
				},
				trade: {
					speaker: "Hans",
					text: "Trade relations, officially. Unofficially? The view. Arendelle is lovely this time of year.",
					choices: [{ text: "It is.", next: "coronation" }],
				},
				coronation: {
					speaker: "Hans",
					text: "The queen will be crowned any moment. She's in the keep. You should pay your respects.",
				},
			},
		},
	},
	let_it_go: {
		elsa: {
			start: "hi",
			nodes: {
				hi: {
					speaker: "Elsa",
					text: "Oh. Hello. You must be one of Anna's new friends. Please, don't come any closer. The room is just... cold.",
					choices: [
						{ text: "Are you alright, Your Majesty?", next: "ok", effects: { rel: { elsa: NICE }, remember: "Elsa" } },
						{ text: "Anna wants to marry Hans. Today.", next: "marry", effects: { rel: { elsa: -NICE }, flags: ["told_elsa"] } },
						{ text: "People say you have magic. Show me!", next: "magic", effects: { flags: ["asked_magic"] } },
					],
				},
				ok: {
					speaker: "Elsa",
					text: "No one has asked me that in years. I'm fine. I have to be. Conceal, don't feel...",
					choices: [{ text: "You don't have to hide.", next: "burst", effects: { rel: { elsa: NICE } } }],
				},
				marry: {
					speaker: "Elsa",
					text: "Marry? A man she just met? No. I won't bless it. She can't— I can't—",
					choices: [{ text: "Elsa, calm down.", next: "burst" }],
				},
				magic: {
					speaker: "Elsa",
					text: "Magic? Who told you... there is no—",
					choices: [{ text: "Your hands, they're glowing!", next: "burst" }],
				},
				burst: {
					speaker: "Elsa",
					text: "Ice bursts from her hands across the floor. Frost climbs the walls. She stares at her hands in horror.",
					choices: [
						{ text: "It's okay! Nobody's hurt!", next: "flee", effects: { rel: { elsa: NICE }, remember: "Elsa" } },
						{ text: "Everyone, get back!", next: "flee" },
					],
				},
				flee: {
					speaker: "Elsa",
					text: "Stay away from me! Please... just stay away!",
					choices: [{ text: "Elsa, wait!", effects: { actions: ["elsa_flee"] } }],
				},
			},
		},
	},
	oakens: {
		kristoff: {
			start: "hi",
			nodes: {
				hi: {
					speaker: "Kristoff",
					text: "Carrots. Behind you. ...Oh, you're not Oaken. Kristoff, ice harvester. Business is terrible. Who needs ice in the middle of this?",
					choices: [
						{ text: "I'll pay for your carrots. For Sven.", next: "pay", effects: { rel: { kristoff: GREAT }, flags: ["paid_carrots"], remember: "Kristoff" } },
						{ text: "You smell like a reindeer.", next: "smell", effects: { rel: { kristoff: -NICE }, flags: ["insulted_kristoff"] } },
						{ text: "Can you take me up the North Mountain?", next: "mountain" },
					],
				},
				pay: {
					speaker: "Kristoff",
					text: "You'd do that? Sven says thank you. I say... thank you. Nobody's done that before.",
					choices: [{ text: "Now, about that mountain...", next: "mountain" }],
				},
				smell: {
					speaker: "Kristoff",
					text: "Reindeer are better than people. At least they're honest. What do you want?",
					choices: [{ text: "A guide up the North Mountain.", next: "mountain" }],
				},
				mountain: {
					speaker: "Kristoff",
					text: "The storm's coming from the North Mountain. Someone's up there doing this.",
					choices: [
						{ text: "It's Elsa. She needs help, not a fight.", next: "go", effects: { rel: { kristoff: NICE, elsa: NICE } } },
						{ text: "I'll buy you a new sled when this is over.", next: "go", effects: { rel: { kristoff: NICE }, flags: ["promised_sled"], remember: "Kristoff" } },
					],
				},
				go: {
					speaker: "Kristoff",
					text: "Fine. We leave now. Take these carrots, Sven insists. Head north past town. I'll be right behind you.",
					choices: [{ text: "Let's go.", effects: { actions: ["give:minecraft:carrot:16"] } }],
				},
			},
		},
		oaken: {
			start: "hi",
			nodes: {
				hi: {
					speaker: "Oaken",
					text: "Yoo-hoo! Big summer blowout! Half off swimming suits, clogs, and a sun balm of my own invention, ja?",
					choices: [
						{ text: "Where is this storm coming from?", next: "storm" },
						{ text: "Show me what you sell.", effects: { actions: ["trade:oaken"] } },
						{ text: "Is that a sauna?", next: "sauna" },
					],
				},
				storm: { speaker: "Oaken", text: "The North Mountain! A very strong one, ja. And that big fella, Kristoff, is at the end of the boardwalk." },
				sauna: { speaker: "Oaken", text: "Hoo hoo! Hi, family! ...You want to buy something, ja?" },
			},
		},
	},
	in_summer: {
		olaf: {
			start: "hi",
			nodes: {
				hi: {
					speaker: "Olaf",
					text: "Hi! I'm Olaf, and I like warm hugs!",
					choices: [
						{ text: "Give him a warm hug.", next: "hug", effects: { rel: { olaf: GREAT }, flags: ["hugged_olaf"], remember: "Olaf" } },
						{ text: "Give him a carrot nose.", next: "nose", requires: { item: "minecraft:carrot" }, effects: { rel: { olaf: NICE }, flags: ["gave_nose"], actions: ["take:minecraft:carrot:1"] } },
						{ text: "Do you know what happens to snow in summer?", next: "summer", effects: { flags: ["summer_song"] } },
					],
				},
				hug: { speaker: "Olaf", text: "Oh! Now that is a warm hug. I think I'm in love. Kidding! ...Unless?", choices: [{ text: "Want to come with me?", next: "join" }] },
				nose: { speaker: "Olaf", text: "Ooh! I've always wanted a nose. It's so cute, like a little baby unicorn!", choices: [{ text: "Want to come with me?", next: "join" }] },
				summer: { speaker: "Olaf", text: "No! But I've always loved the idea of summer, and sun, and all things hot!", choices: [{ text: "...Sure. Want to come with me?", next: "join" }] },
				join: {
					speaker: "Olaf",
					text: "You're going to find Elsa and bring back summer? I'm coming too! The Ice Palace is up the big staircase!",
					choices: [{ text: "Let's go, Olaf.", effects: { actions: ["olaf_follow"] } }],
				},
			},
		},
	},
	north_mountain: {
		elsa: {
			start: "hi",
			nodes: {
				hi: {
					speaker: "Elsa",
					text: "You came all this way. Why? Up here I'm finally free. There's no one to hurt.",
					choices: [
						{ text: "Arendelle is buried in snow, Elsa.", next: "winter" },
						{ text: "Come home. Anna misses you.", next: "home", effects: { rel: { elsa: NICE }, remember: "Elsa" } },
						{ text: "Your palace is incredible.", next: "palace", effects: { rel: { elsa: NICE } } },
					],
				},
				winter: { speaker: "Elsa", text: "What? No... I've doomed everyone. And I don't know how to stop it!", choices: [{ text: "We'll figure it out together.", next: "strike", effects: { rel: { elsa: NICE } } }, { text: "You have to undo this!", next: "strike" }] },
				home: { speaker: "Elsa", text: "Anna... I only ever wanted to keep her safe. I can't go back. I can't control it!", choices: [{ text: "You can, Elsa.", next: "strike" }] },
				palace: { speaker: "Elsa", text: "Thank you. It's the first thing I've ever made that I'm not afraid of.", choices: [{ text: "But Arendelle is freezing.", next: "winter" }] },
				strike: {
					speaker: "Elsa",
					text: "Fear takes over. A blast of ice strikes you in the chest. \"GET OUT!\" A giant snow guardian rises at the palace gate.",
					choices: [{ text: "(Your heart feels cold...)", effects: { actions: ["frozen_heart"] } }],
				},
			},
		},
	},
	fixer_upper: {
		pabbie: {
			start: "hi",
			nodes: {
				hi: {
					speaker: "Grand Pabbie",
					text: "Come, come. You are cold... colder than you should be. There is ice in your heart, put there by your queen.",
					choices: [
						{ text: "Can you fix it?", next: "fix" },
						{ text: "Tell me about Elsa's powers.", next: "powers" },
						{ text: "The trolls keep calling Kristoff a fixer-upper.", next: "kristoff", requires: { minRel: ["kristoff", 2] } },
					],
				},
				powers: { speaker: "Grand Pabbie", text: "She was born with them. Beauty and danger both. Fear will be her enemy.", choices: [{ text: "And my heart?", next: "fix" }] },
				kristoff: {
					speaker: "Grand Pabbie",
					text: "Ha! Love is a force that is powerful and strange. They mean well.",
					choices: [{ text: "And my heart?", next: "fix", effects: { flags: ["trolls_matchmade"], rel: { kristoff: NICE } } }],
				},
				fix: {
					speaker: "Grand Pabbie",
					text: "If it were your head, that would be easy. But only an act of true love can thaw a frozen heart. Take these, and a flower from the valley.",
					choices: [{ text: "Thank you, Grand Pabbie.", effects: { actions: ["give:frozen:snowflake_crystal:2", "give:minecraft:diamond:1", "give:minecraft:poppy:1"], flags: ["knows_true_love"] } }],
				},
			},
		},
	},
	hans_betrayal: {
		hans: {
			start: "hi",
			nodes: {
				hi: {
					speaker: "Hans",
					text: "You're back! The queen, the storm... Arendelle needs a strong leader now.",
					choices: [
						{ text: "I have a frozen heart. I need help.", next: "reveal" },
						{ text: "Where is Anna?", next: "reveal" },
						{ text: "I never trusted you.", next: "knew", requires: { flag: "doubted_hans" } },
					],
				},
				knew: { speaker: "Hans", text: "Clever. Too clever, really.", choices: [{ text: "...", next: "reveal" }] },
				reveal: {
					speaker: "Hans",
					text: "Oh, poor thing. If only there was someone out there who loved you. With the queen gone, Arendelle is mine.",
					choices: [
						{ text: "I trusted you!", requires: { flag: "trusted_hans" }, effects: { flags: ["betrayed"], actions: ["hans_hostile"] } },
						{ text: "Not while I'm standing.", effects: { actions: ["hans_hostile"] } },
					],
				},
			},
		},
	},
};

export interface Ambient {
	lines: string[];
	/** Replaces lines while the Eternal Winter lasts. */
	winterLines?: string[];
	/** Offers a Trade button. */
	trade?: boolean;
}

export const AMBIENT: Record<string, Ambient> = {
	anna: { lines: ["Do you want to build a snowman? ...It doesn't have to be a snowman.", "Joan of Arc and I get along great. She's a painting.", "For the first time in forever!"], winterLines: ["Elsa isn't a monster. She's my sister.", "I'm not giving up on her."] },
	elsa: { lines: ["The cold never bothered me anyway.", "An act of true love will thaw a frozen heart.", "The gates stay open now. Always."] },
	kristoff: { lines: ["Reindeers are better than people. Right, Sven?", "Ice is my life. Want some? Tap Trade.", "Who marries a man she just met?"], trade: true },
	olaf: { lines: ["Some people are worth melting for.", "I don't have a skull... or bones.", "Put me in summer and I'll be a... happy snowman!"] },
	hans: { lines: ["Arendelle is lovely this time of year.", "Care to join me on the balcony?", "My brothers would never believe this."] },
	duke: { lines: ["Weselton. Duke of Weselton. Arendelle's closest partner in trade!", "Sorcery! I knew something dubious was going on here.", "Who wants to dance? Like a chicken with the face of a monkey, I fly!"] },
	oaken: { lines: ["Yoo-hoo! Big summer blowout!", "Hoo hoo! Hi, family!", "That's a very long walk to the North Mountain, ja."], trade: true },
	kai: { lines: ["The coronation must go perfectly.", "Her Majesty requests no one enter the keep uninvited.", "The gates open at noon!"] },
	gerda: { lines: ["Mind the floors, they're freshly polished.", "Princess Anna has been up since dawn. Well... since mid-morning.", "Would you care for some chocolate?"] },
	pabbie: { lines: ["Fear will be her enemy.", "Only an act of true love can thaw a frozen heart.", "The trolls mean well. Mostly."] },
	troll: { lines: ["Kristoff's brought a friend home!", "He's a bit of a fixer-upper!", "We're not rocks! Well... we are, a little."] },
	guard: { lines: ["Keep moving, citizen.", "Long live the Queen!", "The castle gates are open today. Mind your manners."], winterLines: ["Stay inside if you can. It's freezing out here.", "Orders are to find the Queen."] },
	townsfolk: {
		lines: ["The gates are open! Isn't it wonderful?", "I haven't seen the queen in years.", "The harbour's full of ships from all over the world.", "Try the chocolate, it's the best in the kingdom!", "Did you see the princess? She ran right past me!"],
		winterLines: ["Snow in July! What's happening?", "They say the queen has ice powers!", "The fjord froze solid overnight.", "I can't feel my toes...", "Someone has to bring back summer."],
	},
};

export interface Offer {
	label: string;
	wants: [string, number][];
	gives: [string, number];
}

export const OFFERS: Record<string, Offer[]> = {
	kristoff: [
		{ label: "8 Packed Ice  (1 Emerald)", wants: [["minecraft:emerald", 1]], gives: ["minecraft:packed_ice", 8] },
		{ label: "4 Blue Ice  (3 Emeralds)", wants: [["minecraft:emerald", 3]], gives: ["minecraft:blue_ice", 4] },
		{ label: "1 Emerald  (12 Carrots)", wants: [["minecraft:carrot", 12]], gives: ["minecraft:emerald", 1] },
		{ label: "Saddle  (6 Emeralds)", wants: [["minecraft:emerald", 6]], gives: ["minecraft:saddle", 1] },
	],
	oaken: [
		{ label: "Elsa's Glove  (16 Emeralds + 1 Leather)", wants: [["minecraft:emerald", 16], ["minecraft:leather", 1]], gives: ["frozen:elsa_glove", 1] },
		{ label: "Snowflake Crystal  (6 Emeralds)", wants: [["minecraft:emerald", 6]], gives: ["frozen:snowflake_crystal", 1] },
		{ label: "Ice Crown  (8 Emeralds)", wants: [["minecraft:emerald", 8]], gives: ["frozen:ice_helmet", 1] },
		{ label: "8 Carrots  (1 Emerald)", wants: [["minecraft:emerald", 1]], gives: ["minecraft:carrot", 8] },
		{ label: "Poppy  (1 Emerald)", wants: [["minecraft:emerald", 1]], gives: ["minecraft:poppy", 1] },
		{ label: "1 Emerald  (16 Packed Ice)", wants: [["minecraft:packed_ice", 16]], gives: ["minecraft:emerald", 1] },
	],
};

/** Choices worth recapping at the end, Telltale style. */
const RECAP: Record<string, string> = {
	teased_anna: "You teased Anna about oversleeping.",
	warned_anna: "You warned Anna about rushing into love.",
	trusted_hans: "You trusted Prince Hans.",
	doubted_hans: "You doubted Prince Hans from the start.",
	told_elsa: "You told Elsa about Anna's engagement.",
	asked_magic: "You asked Elsa to show her magic.",
	paid_carrots: "You paid for Sven's carrots.",
	insulted_kristoff: "You told Kristoff he smells like a reindeer.",
	promised_sled: "You promised Kristoff a new sled.",
	hugged_olaf: "You gave Olaf a warm hug.",
	gave_nose: "You gave Olaf a carrot nose.",
	trolls_matchmade: "You let the trolls play matchmaker.",
	betrayed: "Hans betrayed your trust.",
};

export function choicesRecap(state: StoryState): string[] {
	return state.flags.filter((f) => RECAP[f]).map((f) => RECAP[f]);
}

/** Epilogue lines that depend on how the player treated everyone. */
export function endingLines(state: StoryState): string[] {
	const rel = (name: string) => state.rel[name] ?? 0;
	const has = (flag: string) => state.flags.includes(flag);
	return [
		"The ice in your heart melts. Across Arendelle, snow turns to summer.",
		rel("elsa") >= 2
			? "Elsa, no longer afraid, turns the castle courtyard into an ice rink for the whole kingdom."
			: "Elsa returns to Arendelle. The gates stay open, a little wider every day.",
		rel("anna") >= 2 ? "Anna calls you her best friend, and means it." : "Anna finally has her sister back.",
		rel("kristoff") >= 2 || has("promised_sled")
			? "Kristoff gets a brand-new sled, and is named Official Arendelle Ice Master and Deliverer."
			: "Kristoff heads back to the mountains with Sven, happier than he admits.",
		has("hugged_olaf") || has("gave_nose")
			? "Olaf gets his own personal flurry, and finally enjoys summer."
			: "Olaf enjoys summer... carefully.",
		has("doubted_hans") ? "Your instincts about Hans were right all along." : "You'll never trust a prince who sings duets again.",
		"The Duke of Weselton is sent home. Arendelle will no longer do business with Weaseltown.",
	];
}
