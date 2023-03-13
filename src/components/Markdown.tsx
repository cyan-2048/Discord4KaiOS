import { observeElement } from "@/lib/shared";
import parse from "@lib/discord-markdown";
import { h, Fragment, Component } from "preact";
import { MutableRef, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Readable, Unsubscriber } from "svelte/store";

interface Props {
	text: string;
	discordOnly: boolean;
	embed: boolean;
}

interface MarkdownNodeProps {
	type: string;
	content?: string | MarkdownNodeProps[];
	target?: string;
	id?: string;
	name?: string;
	animated?: boolean;
	reference?: any;
}

function EmojiElement({ name, id, animated }: { id: string; animated: boolean; name: string }) {
	const [inView, setState] = useState(false);
	const emojiRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (animated) {
			return observeElement(emojiRef.current).subscribe((val) => setState(val));
		}
	}, [animated]);

	return (
		<div ref={emojiRef} class="emoji" style={{ "--emoji_url": `url('https://cdn.discordapp.com/emojis/${id}.${animated && inView ? "gif" : "png"}?size=32'))` }}>
			<span>{name}</span>
		</div>
	);
}

function MarkdownNode({ type, content, target, id, name, animated, reference: ref }: MarkdownNodeProps) {
	if (type == "codeBlock") {
		return (
			<pre>
				<code>{content}</code>
			</pre>
		);
	} else if (type == "blockquote") {
		return (
			<blockquote>
				<MarkdownContent content={content} reference={ref} />
			</blockquote>
		);
	} else if (type == "link") {
		return (
			<a href={target}>
				<MarkdownContent content={content} />
			</a>
		);
	} else if (type == ":emoji:") {
		return <EmojiElement id={id} name={name} animated={animated}></EmojiElement>;
	} else if (["em", "strong", "u", "del", "code"].includes(type)) {
		return h(type, null, <MarkdownContent content={content} reference={ref} />);
	} else if (["@everyone", "@here"].includes(type)) {
		return <span class="mentions">{type}</span>;
	} else if (type === "text") {
		return <>{content}</>;
	}
	// TODO: Mentions component
	// {:else if /^(@|#)/.test(type)}
	// 	<Mentions type={type.slice(1)} {id} {...ref} />
	else if (content) {
		return <MarkdownContent content={content} reference={ref} />;
	}
}

function MarkdownContent({ content = [], reference }: { content: string | MarkdownNodeProps[]; reference?: any }) {
	return <>{typeof content === "string" ? content : content.map((node) => MarkdownNode({ ...node, reference }))}</>;
}

export function Markdown({ text = "", ...props }: Partial<Props> = {}) {
	const tree: MarkdownNodeProps[] = useMemo(() => parse(text, props), [text, props]);
	return <MarkdownContent content={tree} reference={null} />;
}
