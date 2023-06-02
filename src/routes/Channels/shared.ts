import { sn } from "@shared";
import { hash, sleep } from "@utils";
import { signal } from "@preact/signals";
import { GuildChannel } from "discord/GuildChannels";
import { Guild } from "discord/Guilds";
import { GuildFolder } from "discord/types";

export const channelsSN = "channels" + hash(Math.random().toString());
export const serversSN = "servers" + hash(Math.random().toString());

export interface UIFolder {
	type: "folder";
	servers: Guild[];
	props: GuildFolder;
}

export const guildID = signal("@me");
export const pageState = signal<0 | 1>(0);
export const focusedChannel = signal(0);

export async function noChannelsFound() {
	await sleep(10);
	pageState.value = 0;
	sn.focus(serversSN);
	console.log("TODO Modals", "no channels found");
}

export function siftTheSiftedChannelsBruh(arr?: GuildChannel[]) {
	return arr
		?.filter((a) => {
			if (a.type === 0 || a.type == 5) {
				const perms = a.roleAccess();
				return perms.read;
			}
			return true;
		})
		.filter((a, i, arr) => {
			if (a.type == 4) {
				const next = arr[i + 1];
				if (!next || next.type == 4) return false;
			}
			return true;
		});
}
