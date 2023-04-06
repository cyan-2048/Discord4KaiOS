import { observeElement } from "@/lib/shared";
import parse from "@lib/discord-markdown";
import { h, Fragment, Component } from "preact";
import { CSSProperties, memo } from "preact/compat";
import { MutableRef, useEffect, useMemo, useRef, useState } from "preact/hooks";
import Mentions from "./Mentions";

interface Props {
	text: string;
	discordOnly: boolean;
	embed: boolean;
	reference: any;
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

function EmojiElement({
	name,
	id,
	animated,
}: {
	id: string;
	animated: boolean;
	name: string;
}) {
	const [inView, setState] = useState(false);
	const emojiRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (animated) {
			return observeElement(emojiRef.current).subscribe((val) => setState(val));
		}
	}, [animated]);

	const url = `url('https://cdn.discordapp.com/emojis/${id}.${
		animated && inView ? "gif" : "png"
	}?size=32')`;

	return (
		<div
			ref={emojiRef}
			class="emoji"
			style={
				{
					"--emoji_url": url,
				} as CSSProperties
			}
		>
			<span>{name}</span>
		</div>
	);
}

function MarkdownNode({
	type,
	content,
	target,
	id,
	name,
	animated,
	reference: ref,
}: MarkdownNodeProps) {
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
		return (
			<EmojiElement id={id} name={name} animated={animated}></EmojiElement>
		);
	} else if (["em", "strong", "u", "del", "code"].includes(type)) {
		return h(type, null, <MarkdownContent content={content} reference={ref} />);
	} else if (["@everyone", "@here"].includes(type)) {
		return <span class="mentions">{type}</span>;
	} else if (type === "text") {
		return <>{content}</>;
	} else if (
		// TODO: Mentions component
		/^(@|#)/.test(type)
	) {
		return <Mentions type={type.slice(1)} id={id} {...ref} />;
	} else if (content) {
		return <MarkdownContent content={content} reference={ref} />;
	}
}

const MarkdownContent = memo(function MarkdownContent({
	content = [],
	reference,
}: {
	content: string | MarkdownNodeProps[];
	reference?: any;
}) {
	return (
		<>
			{typeof content === "string"
				? content
				: content.map((node) => MarkdownNode({ ...node, reference }))}
		</>
	);
});

export const Markdown = memo(function Markdown({
	text = "",
	...props
}: Partial<Props> = {}) {
	const tree: MarkdownNodeProps[] = useMemo(
		() => parse(text, props),
		[text, props]
	);
	return <MarkdownContent content={tree} reference={props.reference || null} />;
});
