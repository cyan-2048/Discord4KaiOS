import { rules } from "discord-markdown-parser/src";
import SimpleMarkdown from "simple-markdown";

import * as styles from "./Markdown.module.scss";
import type { Emoji } from "@workers";
import { findByShortCode } from "@workers";

import {
	ErrorBoundary,
	For,
	JSXElement,
	Match,
	Show,
	Switch,
	batch,
	createRenderEffect,
	createSignal,
	onCleanup,
	onMount,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { createStore, reconcile, unwrap } from "solid-js/store";
import { FocusableLink } from "./MessageEmbeds";
import { extend } from "discord-markdown-parser/src/utils/extend";

const shortcodeCache = new Map<string, Emoji>();

const parser = SimpleMarkdown.parserFor({
	...rules,
	":shortcode:": {
		order: rules.strong.order,
		match: (source: any) => /^:(\S+):/.exec(source),
		parse(capture: any) {
			const emoji = shortcodeCache.get(capture[1])?.$;

			if (emoji) {
				return {
					type: "twemoji",
					name: emoji,
				};
			}

			return {
				type: ":shortcode:",
				name: capture[1],
				content: capture[0],
			};
		},
	},

	subtext: extend(
		{
			match: function (source, state) {
				if (state.disallowBlock) {
					return null;
				}
				if (state.prevCapture == null || state.prevCapture[0] === "\n" || "-#" == state.prevCapture[1]) {
					return /^-# +([^\n]+?)(\n|$)/.exec(source);
				}
				return null;
			},
			parse: function (capture) {
				return {
					type: "subtext",
					content: [{ type: "text", content: capture[1].trim() }],
				};
			},
		},
		SimpleMarkdown.defaultRules.heading
	),
});

const parse = (input: string) => {
	// console.log("PARSE CALLED!!!!");
	return parser(input, { inline: true });
};

export type MarkdownNode = ReturnType<typeof parse>[number];

function List(props: {
	node: MarkdownNode;
	options: Options & { forceUpdate: () => void };
	bigEmoji: boolean;
}) {
	return (
		<Dynamic
			component={props.node.ordered ? "ol" : "ul"}
			start={props.node.ordered ? Math.min(Number(props.node.start), 1000000000) : undefined}
			style={
				props.node.ordered
					? {
							"--total": String(Number(props.node.start) - 1 + props.node.items.length).length,
					  }
					: undefined
			}
		>
			<For each={props.node.items}>
				{(a: MarkdownNode) => (
					<li>
						<Factory node={a} options={props.options} bigEmoji={props.bigEmoji}></Factory>
					</li>
				)}
			</For>
		</Dynamic>
	);
}

function ShortcodeEmoji(props: { content: string; name: string; forceUpdate: () => void }) {
	const [found, setFound] = createSignal("");

	let mounted = true;

	onMount(async () => {
		const emoji = await findByShortCode(props.name);
		emoji && shortcodeCache.set(props.name, emoji);
		if (mounted && emoji) {
			setFound(emoji.$);
			props.forceUpdate();
		}
	});

	onCleanup(() => {
		mounted = false;
	});

	return <>{found() || props.content}</>;
}

function Unsupported(props: { children: JSXElement; node: MarkdownNode }) {
	console.error("[Markdown] Unsupported node", unwrap(props.node));
	return props.children;
}

function Factory(props: {
	node: MarkdownNode;
	options: Options & { forceUpdate: () => void };
	bigEmoji: boolean;
}) {
	const child = () => {
		// console.log("CHILD CALLED", { ...props });
		// console.log("CHILD CALLED");
		return <Factory node={props.node.content} options={props.options} bigEmoji={props.bigEmoji} />;
	};

	// console.log("FACTORY", props.node);

	return (
		<Show when={props.node}>
			<Switch
				fallback={
					<Unsupported node={props.node}>
						<Dynamic component={child} />
					</Unsupported>
				}
			>
				<Match when={Array.isArray(props.node)}>
					<For each={props.node as unknown as MarkdownNode[]}>
						{(a) => <Factory node={a} options={props.options} bigEmoji={props.bigEmoji} />}
					</For>
				</Match>
				<Match when={typeof props.node == "string"}>{props.node as unknown as string}</Match>
				<Match when={props.node.type}>
					<Show
						when={props.options.renderer && props.options.renderer[props.node.type]}
						fallback={
							<Switch
								fallback={
									<Unsupported node={props.node}>
										<Dynamic component={child} />
									</Unsupported>
								}
							>
								<Match when={props.node.type === "text"}>{props.node.content}</Match>
								<Match when={props.options.inline && ["newline", "br"].includes(props.node.type)}> </Match>
								<Match when={props.node.type == "newline"}>
									<br />
								</Match>
								<Match when={["underline", "strikethrough"].includes(props.node.type)}>
									<Dynamic component={props.node.type[0]}>
										<Dynamic component={child} />
									</Dynamic>
								</Match>
								<Match when={["em", "strong", "br", "blockQuote"].includes(props.node.type)}>
									<Dynamic component={props.node.type.toLowerCase()}>
										<Dynamic component={child} />
									</Dynamic>
								</Match>

								<Match when={props.node.type == "heading"}>
									<Dynamic component={props.options.inline ? "b" : `h${props.node.level}`}>
										<Dynamic component={child} />
									</Dynamic>
								</Match>

								<Match when={props.node.type == "inlineCode"}>
									<code class={styles.inline}>
										<Dynamic component={child} />
									</code>
								</Match>

								<Match when={["everyone", "here"].includes(props.node.type)}>{"@" + props.node.type}</Match>

								<Match when={["url", "autolink", "link"].includes(props.node.type)}>
									<FocusableLink
										onNavigate={() => {
											window.open(props.node.target, "_blank");
										}}
										href={props.node.target}
									>
										<Dynamic component={child} />
									</FocusableLink>
								</Match>

								<Match when={props.node.type == "list"}>
									<Show when={!props.options.inline} fallback={" "}>
										<List node={props.node} options={props.options} bigEmoji={props.bigEmoji} />
									</Show>
								</Match>

								<Match when={props.node.type == ":shortcode:"}>
									<ShortcodeEmoji
										content={props.node.content}
										name={props.node.name}
										forceUpdate={props.options.forceUpdate}
									/>
								</Match>
							</Switch>
						}
					>
						<Dynamic
							component={props.options.renderer![props.node.type]}
							node={props.node}
							child={child}
							noRenderer={() => (
								<Factory
									node={props.node}
									options={{ ...props.options, renderer: undefined }}
									bigEmoji={props.bigEmoji}
								/>
							)}
							ref={props.options.ref}
							bigEmoji={props.bigEmoji}
						/>
					</Show>
				</Match>
			</Switch>
		</Show>
	);
}

export type Renderer = Record<
	string,
	(props: {
		node: MarkdownNode;
		child: () => JSXElement;
		noRenderer: () => JSXElement;
		ref: MarkdownRef;
		bigEmoji: boolean;
	}) => JSXElement
>;

interface Options {
	renderer?: Renderer;
	inline?: boolean;
	ref: MarkdownRef;
}

export interface MarkdownRef {
	ast: ReturnType<typeof parse>;
	bigEmoji: boolean;
}

function MarkdownWithForceUpdate(props: MarkdownProps) {
	const [show, setShow] = createSignal(true);

	function forceUpdate() {
		setShow(false);
		Promise.resolve().then(() => {
			console.warn("A COMPONENT WAS FORCED TO UPDATE");
			setShow(true);
		});
	}

	return (
		<Show when={show()}>
			<_Markdown {...props} forceUpdate={forceUpdate} />
		</Show>
	);
}

export default function Markdown(props: MarkdownProps) {
	return (
		<ErrorBoundary
			fallback={(e) => {
				console.error(e);
				return (
					<span style={{ "background-color": "red", color: "white" }} class={styles.markdown}>
						An Error occured while trying to render this component. {props.text}
					</span>
				);
			}}
		>
			<MarkdownWithForceUpdate {...props} />
		</ErrorBoundary>
	);
}

export interface MarkdownProps extends Omit<Options, "ref"> {
	text: string;
	setBigEmoji?: (v: boolean) => void;
	setMarkdownRef?: (v: MarkdownRef) => void;
}

interface MarkdownPropsForceUpdate extends MarkdownProps {
	forceUpdate: () => void;
}

function _Markdown(props: MarkdownPropsForceUpdate) {
	const [ast, setAst] = createStore([] as SimpleMarkdown.SingleASTNode[], {});

	const [__ast, setHiddenAst] = createSignal<SimpleMarkdown.SingleASTNode[]>([]);

	createRenderEffect(() => {
		const newAST = parse(props.text);
		batch(() => {
			setAst(reconcile(newAST, { merge: true }));
			setHiddenAst(newAST);
		});
	});

	const [bigEmoji, setBigEmoji] = createSignal(false);

	const markdownRefObject: MarkdownRef = {
		ast: [],
		get bigEmoji() {
			return bigEmoji();
		},
		set bigEmoji(v) {
			setBigEmoji(v);
		},
	};

	createRenderEffect(() => {
		const _ast = __ast();
		// console.log("MARKDOWN AST", _ast);
		markdownRefObject.ast = _ast;

		const filteredAST = _ast.filter((a) => {
			// we act like text with only whitespace are non existent
			if (a.type == "br" || (a.type == "text" && a.content.trim().length == 0)) return false;
			return true;
		});

		// console.log("FILTERED", filteredAST);

		markdownRefObject.bigEmoji = false;

		// console.log(
		// 	"FILTERED CHECK",
		// 	filteredAST.every((a) => a.type == "emoji" || a.type == "twemoji")
		// );

		// we check length first because that's going to return faster
		if (filteredAST.length < 31 && filteredAST.every((a) => a.type == "emoji" || a.type == "twemoji")) {
			markdownRefObject.bigEmoji = true;
		}

		if (props.setMarkdownRef) {
			props.setMarkdownRef(markdownRefObject);
		}

		if (props.setBigEmoji) {
			// console.log("SET BIG EMOJI", !!markdownRefObject.bigEmoji);
			props.setBigEmoji(!!markdownRefObject.bigEmoji);
		}
	});

	// console.log(markdownRefObject);

	return (
		<span class={styles.markdown}>
			<For each={ast}>
				{(a) => {
					return (
						<Factory
							node={a}
							options={{
								renderer: props.renderer,
								inline: props.inline,
								ref: markdownRefObject,
								forceUpdate: props.forceUpdate,
							}}
							bigEmoji={bigEmoji()}
						/>
					);
				}}
			</For>
		</span>
	);
}
