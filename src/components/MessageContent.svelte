<script>
	import markdown from "../lib/discord-markdown";
	import EmojiDict from "../lib/EmojiDict";
	import MarkdownContent from "./MarkdownContent.svelte";

	export let content = "",
		options = {},
		roles = null,
		guildID = null;

	function parseContent(content, options) {
		if (content === "") return [];
		return markdown(content, options);
	}

	$: _content = parseContent(content, options);
</script>

<MarkdownContent ref={{ guildID, roles }} content={_content} />
