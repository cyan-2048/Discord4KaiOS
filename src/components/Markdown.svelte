<script>
	import { onMount } from "svelte";
	import { observeElement } from "../lib/shared";
	import MarkdownContent from "./MarkdownContent.svelte";
	import Mentions from "./Mentions.svelte";

	export let type = null,
		content = null,
		target = null,
		id = null,
		name = null,
		animated = null,
		ref = null;

	let el,
		inView = false;

	onMount(() => {
		if (el && animated) {
			return observeElement(el).subscribe((val) => (inView = val));
		}
	});
</script>

{#if type === "codeBlock"}
	<pre><code>{content}</code></pre>
{:else if type === "blockquote"}
	<blockquote>
		<MarkdownContent {content} {ref} />
	</blockquote>
{:else if type === "link"}
	<a href={target}><MarkdownContent {content} {ref} /></a>
{:else if type === ":emoji:"}
	<div bind:this={el} class="emoji" style="--emoji_url: url('https://cdn.discordapp.com/emojis/{id}.{animated && inView ? 'gif' : 'png'}?size=32');">
		<span>{name}</span>
	</div>
{:else if ["em", "strong", "u", "del", "code"].includes(type)}
	<svelte:element this={type}><MarkdownContent {content} {ref} /></svelte:element>
{:else if ["@everyone", "@here"].includes(type)}
	<span class="mentions">{type}</span>
{:else if type === "text"}
	{content}
{:else if /^(@|#)/.test(type)}
	<Mentions type={type.slice(1)} {id} {...ref} />
{:else if content}<MarkdownContent {content} {ref} />{/if}
