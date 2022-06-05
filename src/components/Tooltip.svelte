<script>
	// _            _ _ _               _     _                               _
	//                                    | |          (_) | |             | |   | |                             | |
	//   ___  ___ _ __ __ _ _ __   ___  __| | __      ___| | |  _ __   ___ | |_  | |__   ___   _   _ ___  ___  __| |
	//  / __|/ __| '__/ _` | '_ \ / _ \/ _` | \ \ /\ / / | | | | '_ \ / _ \| __| | '_ \ / _ \ | | | / __|/ _ \/ _` |
	//  \__ \ (__| | | (_| | |_) |  __/ (_| |  \ V  V /| | | | | | | | (_) | |_  | |_) |  __/ | |_| \__ \  __/ (_| |
	//  |___/\___|_|  \__,_| .__/ \___|\__,_|   \_/\_/ |_|_|_| |_| |_|\___/ \__| |_.__/ \___|  \__,_|___/\___|\__,_|
	//                     | |
	//                     |_|

	export let style = "";
	export let arrow = "bottom";
</script>

<div class={arrow} {style}>
	<slot />
</div>

<style>
	div {
		position: relative;
		width: 120px;
		background-color: black;
		color: #fff;
		text-align: center;
		border-radius: 6px;
		padding: 5px 0;
		z-index: 1;
		bottom: 150%;
		left: 50%;
		margin-left: -60px;
	}
	.bottom::after {
		content: "";
		position: absolute;
		top: 100%;
		left: 50%;
		margin-left: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: black transparent transparent transparent;
	}
	.top::after {
		content: " ";
		position: absolute;
		bottom: 100%; /* At the top of the tooltip */
		left: 50%;
		margin-left: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: transparent transparent black transparent;
	}
	.left::after {
		content: " ";
		position: absolute;
		top: 50%;
		right: 100%; /* To the left of the tooltip */
		margin-top: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: transparent black transparent transparent;
	}
	.right::after {
		content: " ";
		position: absolute;
		top: 50%;
		left: 100%; /* To the right of the tooltip */
		margin-top: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: transparent transparent transparent black;
	}
</style>
