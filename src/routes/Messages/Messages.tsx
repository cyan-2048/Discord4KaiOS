import { Markdown } from "@components/Markdown";
import "./style.scss";

import { currentChannel } from "@lib/shared";
import { scrollToBottom, setMapAndReturn, sleep, stringifyDate, useDestroy, useReadable } from "@lib/utils";
import DiscordMessage, { RawMessage } from "discord/Message";
import { ComponentChildren, JSX, h } from "preact";
import { memo, useEffect, useMemo, useRef } from "preact/compat";
import clx from "obj-str";
import Mentions from "@/components/Mentions";
import { Guild } from "discord/Guilds";
import { User } from "discord/libs/types";
import handleActionMessage from "@/components/ActionMessages";
import charRegex from "char-regex";
import { get } from "discord/main";
import { MutableRef } from "preact/hooks";

function timeDif(...args: Date[]) {
	const [dt2, dt1] = args.map((a) => +new Date(a));
	var diff = (dt2 - dt1) / 1000;
	diff /= 60;
	return Math.abs(Math.round(diff)) > 0;
}

function decideDateSeparator(...args: RawMessage[]) {
	return new Set(args.map((a) => new Date(a?.timestamp).toLocaleDateString("en-us"))).size != 1;
}

function decideMessageSeparator(index: number, message: RawMessage, last_message?: RawMessage) {
	return Boolean(
		decideDateSeparator(message, last_message) ||
			timeDif(last_message?.timestamp, message.timestamp) ||
			index == 0 ||
			last_message?.author.id != message.author?.id ||
			last_message?.type != message.type ||
			message.referenced_message ||
			message.interaction
	);
}

export const CHAR_REGEX = charRegex();
export const EMOJI_REGEX =
	/\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\u2764\uFE0F\u200D\uD83D\uDC8B\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFE])|\uD83C\uDFFE\u200D\u2764\uFE0F\u200D\uD83D\uDC8B\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C\uDFFD\u200D\u2764\uFE0F\u200D\uD83D\uDC8B\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C\uDFFC\u200D\u2764\uFE0F\u200D\uD83D\uDC8B\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C\uDFFB\u200D\u2764\uFE0F\u200D\uD83D\uDC8B\u200D\uD83E\uDDD1(?:\uD83C[\uDFFC-\uDFFF]))|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])\u200D\u2764\uFE0F\u200D\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D\u2764\uFE0F\u200D\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\u200D\u2764\uFE0F\u200D\uD83D\uDC8B\u200D\uD83D\uDC68|(?:\uD83C[\uDFFB-\uDFFF])\u200D\u2764\uFE0F\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\u2764\uFE0F\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFE])|\uD83C\uDFFE\u200D\u2764\uFE0F\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C\uDFFD\u200D\u2764\uFE0F\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C\uDFFC\u200D\u2764\uFE0F\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C\uDFFB\u200D\u2764\uFE0F\u200D\uD83E\uDDD1(?:\uD83C[\uDFFC-\uDFFF]))|\uD83D\uDC69(?:\u200D\u2764\uFE0F\u200D\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|(?:\uD83C[\uDFFB-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D[\uDC68\uDC69])(?:\uD83C[\uDFFB-\uDFFF]))|\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|\uD83D\uDC68\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83D\uDC68\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83D\uDC68\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83D\uDC68\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83D\uDC68\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83D\uDC69(?:\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69])(?:\uD83C[\uDFFB-\uDFFE])|\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69])(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69])(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69])(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69])(?:\uD83C[\uDFFC-\uDFFF]))|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68\u200D(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC68\u200D\u2764\uFE0F\u200D\uD83D\uDC68|\uD83D\uDC69\u200D\u2764\uFE0F\u200D(?:\uD83D[\uDC68\uDC69])|\uD83E\uDDD1\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC68(?:\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|(?:\uD83D[\uDC67-\uDC69])\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]\uFE0F)|\uD83E\uDEF1(?:\uD83C\uDFFF\u200D\uD83E\uDEF2(?:\uD83C[\uDFFB-\uDFFE])|\uD83C\uDFFE\u200D\uD83E\uDEF2(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C\uDFFD\u200D\uD83E\uDEF2(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C\uDFFC\u200D\uD83E\uDEF2(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C\uDFFB\u200D\uD83E\uDEF2(?:\uD83C[\uDFFC-\uDFFF]))|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83C\uDFF3\uFE0F\u200D\u26A7|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642])\uFE0F|(?:\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF]))\u200D[\u2695\u2696\u2708]\uFE0F|\uD83D\uDC69\u200D(?:\uD83D[\uDC67\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|(?:\uD83D\uDE36\u200D\uD83C\uDF2B|\uD83D\uDC3B\u200D\u2744|\uD83C\uDFF4\u200D\u2620|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDF])\u200D[\u2640\u2642])\uFE0F|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83E\uDDD1\u200D[\u2695\u2696\u2708]\uFE0F|\u2764\uFE0F\u200D(?:\uD83D\uDD25|\uD83E\uDE79)|(?:\uD83D[\uDC68\uDC69])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D[\u2695\u2696\u2708]\uFE0F)|\uD83D\uDE35\u200D\uD83D\uDCAB|\uD83D\uDE2E\u200D\uD83D\uDCA8|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC08\u200D\u2B1B|\uD83E\uDDD1\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDC66\uDC67\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|(?:[\u270A\u270B]|\uD83C[\uDF85\uDFC3\uDFC7]|\uD83D[\uDC43\uDC4A-\uDC4C\uDC4F\uDC50\uDC66-\uDC69\uDC6B-\uDC6E\uDC70-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3D\uDD3E\uDD77\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD\uDEC3-\uDEC5\uDEF0-\uDEF6])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u26F9\u270C\u270D]|\uD83C[\uDFC2\uDFC4\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC46-\uDC49\uDC4D\uDC4E\uDD74\uDD75\uDD90])(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|(?:[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9\u23EA\u23ED-\u23EF\u23F1-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7\u26F8\u26FA\u26FD\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2753\u2757\u2763\u2764\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE1A\uDE2F\uDE37\uDF0D-\uDF0F\uDF15\uDF1C\uDF21\uDF24-\uDF2C\uDF36\uDF78\uDF7D\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFA7\uDFAC-\uDFAE\uDFC6\uDFCD\uDFCE\uDFD4-\uDFE0\uDFED\uDFF3\uDFF5\uDFF7]|\uD83D[\uDC08\uDC15\uDC1F\uDC26\uDC3F\uDC41\uDC53\uDC6A\uDC7D\uDCA3\uDCB0\uDCB3\uDCBB\uDCBF\uDCCB\uDCDA\uDCDF\uDCE4-\uDCE6\uDCEA-\uDCED\uDCF7\uDCF9-\uDCFB\uDCFD\uDD08\uDD0D\uDD12\uDD13\uDD49\uDD4A\uDD50-\uDD67\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDE10\uDE87\uDE8D\uDE91\uDE94\uDE98\uDEAD\uDEB2\uDEB9\uDEBA\uDEBC\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])\uFE0F|[\u23EB\u23EC\u23F0\u26CE\u2705\u270A\u270B\u2728\u274C\u274E\u2754\u2755\u2795-\u2797\u27B0\u27BF]|\uD83C[\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF0C\uDF10-\uDF14\uDF16-\uDF1B\uDF1D-\uDF20\uDF2D-\uDF35\uDF37-\uDF77\uDF79-\uDF7C\uDF7E-\uDF92\uDFA0-\uDFA6\uDFA8-\uDFAB\uDFAF-\uDFC1\uDFC3\uDFC5\uDFC7-\uDFC9\uDFCF-\uDFD3\uDFE1-\uDFEC\uDFEE-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC1E\uDC20-\uDC25\uDC27-\uDC3E\uDC40\uDC43-\uDC45\uDC4A-\uDC4C\uDC4F-\uDC52\uDC54-\uDC69\uDC6B-\uDC7C\uDC7E-\uDCA2\uDCA4-\uDCAF\uDCB1\uDCB2\uDCB4-\uDCBA\uDCBC-\uDCBE\uDCC0-\uDCCA\uDCCC-\uDCD9\uDCDB-\uDCDE\uDCE0-\uDCE3\uDCE7-\uDCE9\uDCEE-\uDCF6\uDCF8\uDCFC\uDCFF-\uDD07\uDD09-\uDD0C\uDD0E-\uDD11\uDD14-\uDD3D\uDD4B-\uDD4E\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE0F\uDE11-\uDE4F\uDE80-\uDE86\uDE88-\uDE8C\uDE8E-\uDE90\uDE92\uDE93\uDE95-\uDE97\uDE99-\uDEAC\uDEAE-\uDEB1\uDEB3-\uDEB8\uDEBB\uDEBD-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEDD-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDDFF\uDE70-\uDE74\uDE78-\uDE7C\uDE80-\uDE86\uDE90-\uDEAC\uDEB0-\uDEBA\uDEC0-\uDEC5\uDED0-\uDED9\uDEE0-\uDEE7\uDEF0-\uDEF6]/;

/**
 * will return true if the emoji should be big or not
 * @param content the messageContent
 */
function testEmojiFont(content: string, contentEl: MutableRef<HTMLElement>) {
	// fail early
	if (!content || !contentEl.current) return false;

	const SKULL = "💀";
	const clone = contentEl.current.cloneNode(true) as HTMLElement;
	clone.querySelectorAll(".emoji").forEach((a) => {
		try {
			a.parentNode.replaceChild(document.createTextNode(SKULL), a);
		} catch (e) {}
	});

	const string = clone.innerText;

	console.log(string);

	// fail early again
	if (!string.length) return false;

	const filtered = string.match(CHAR_REGEX)?.filter((a) => a != " " && a != "\n");

	console.log("filtered", filtered);

	// assume everything is emoji
	// if exceeds max then it is false
	if (filtered.length > 27) return false;

	// TODO: create a better emoji detection system
	return filtered.every((a) => a === SKULL || EMOJI_REGEX.test(a));
}

const MessageSeparator = memo(function MessageSeparator({ children: { rawMessage: msg, guildInstance } }: { children: DiscordMessage }) {
	const user = msg.author;
	const image = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.jpg?size=24` : null;

	return (
		<main class="MessageSeparator">
			<img src={image || "/css/default.png"} />
			<div class="name">
				<div class="user">
					<b>
						<Mentions guildInstance={guildInstance} mentions={false} type="user" username={user.username} id={user.id} prefix={false} />
					</b>
				</div>
				{user.bot && <div class="bot">{user.discriminator === "0000" ? "WEBHOOK" : "BOT"}</div>}
				<div class="date">{stringifyDate(msg.timestamp)}</div>
			</div>
		</main>
	);
});

const MessageContent = memo(function MessageContent({ children: message }: { children: DiscordMessage }) {
	const content = useReadable(message.content);
	return <Markdown reference={{ guildInstance: message.guildInstance }} text={content} embed={!!message.rawMessage.author.bot}></Markdown>;
});

const MessageReference = memo(function MessageReference({
	guildInstance,
	user,
	content = "",
	embed = false,
}: {
	content: string;
	embed?: boolean;
	user: User;
	guildInstance: Guild;
}) {
	return (
		<div class="reply">
			<div class="r-icon" />
			<div class="r-text">
				<b>
					<Mentions guildInstance={guildInstance} mentions={false} type="user" username={user.username || null} id={user.id} prefix={false} />{" "}
				</b>
				<span>
					<Markdown reference={{ guildInstance }} text={content} embed={embed}></Markdown>
				</span>
			</div>
		</div>
	);
});

const Message = memo(function Message({ message, separate, children }: { message: DiscordMessage; children?: ComponentChildren; separate: boolean }) {
	// const [focused, setFocused] = useState(false);
	const messageEl = useRef<HTMLDivElement>(null);
	const messageProps = useReadable(message.props);
	const deleted = useReadable(message.deleted);

	const messageContent = useReadable(message.content);
	const messageContentEl = useRef<HTMLDivElement>(null);

	const emojiBig = useMemo(() => testEmojiFont(messageContent, messageContentEl), [messageContent, messageContentEl]);

	return (
		<div
			// onFocus={() => setFocused(true)}
			// onBlur={() =>
			// 	void (document.activeElement !== messageEl.current && setFocused(false))
			// }
			ref={messageEl}
			data-focusable=""
			tabIndex={0}
			class={clx({ Message: 1, mention: message.wouldPing(), deleted })}
			key={message.id}
		>
			{(messageProps.referenced_message || messageProps.interaction) && (
				<MessageReference
					content={
						messageProps.referenced_message ? messageProps.referenced_message.content : `used [/${messageProps.interaction?.name}](https://www.youtube.com/watch?v=dQw4w9WgXcQ)`
					}
					embed={!!messageProps.interaction}
					guildInstance={message.guildInstance}
					user={messageProps.referenced_message?.author || messageProps.interaction?.user}
				></MessageReference>
			)}
			{separate && <MessageSeparator>{message}</MessageSeparator>}
			{children}
			<div ref={messageContentEl} class={clx({ content: 1, edited: messageProps.edited_timestamp, "emoji-big": emojiBig })}>
				<MessageContent>{message}</MessageContent>
			</div>
		</div>
	);
});

export default memo(function Messages({ hidden, channelID }: { hidden: boolean; channelID: string }) {
	const handler = currentChannel.value?.messages;
	if (!handler) return;

	//handler.removeMessages = false;

	const chatboxEl = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// scroll chatbox to bottom
		sleep(20).then(() => scrollToBottom(chatboxEl.current));
	}, [handler]);

	const cachedMessages = useRef(new Map<string, JSX.Element>());

	const messages = useReadable(handler.state);

	useDestroy(() => {
		cachedMessages.current.clear();
	});

	return (
		<main class="Messages" style={{ visibility: hidden ? "hidden" : null }}>
			<div ref={chatboxEl} class="chatbox">
				{messages.map(
					(message, index, arr) =>
						cachedMessages.current.get(message.id) ||
						setMapAndReturn(
							cachedMessages.current,
							message.id,
							handleActionMessage(message) || <Message separate={decideMessageSeparator(index, message.rawMessage, arr[index - 1]?.rawMessage)} message={message}></Message>
						)
				)}
			</div>
		</main>
	);
});
