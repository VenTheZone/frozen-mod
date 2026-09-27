// Prints every voiced line as JSON [{id, who, text}] for gen_voices.py. Run: node tools/voice_lines.ts
import { AMBIENT, CAMPAIGN } from "../src/campaign.ts";
import { voiceId } from "../src/logic.ts";

const lines = new Map<string, { id: string; who: string; text: string }>();
const add = (who: string, text: string) => lines.set(voiceId(text), { id: voiceId(text), who, text });

for (const chapter of Object.values(CAMPAIGN)) {
	for (const conv of Object.values(chapter)) {
		for (const node of Object.values(conv.nodes)) add(node.speaker.toLowerCase().split(" ").pop() ?? "", node.text);
	}
}
for (const [npc, ambient] of Object.entries(AMBIENT)) {
	for (const text of [...ambient.lines, ...(ambient.winterLines ?? [])]) add(npc, text);
}
console.log(JSON.stringify([...lines.values()], null, 1));
