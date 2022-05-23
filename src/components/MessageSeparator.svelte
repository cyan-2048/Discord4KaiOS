<script>
	export let id = null;
	export let name = null;
	export let avatar = null;
	export let discord;

	let image = avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.jpg?size=24` : null;
</script>

<main>
	<img src={image || "/css/default.png"} alt /><b>{name}</b>
</main>

<style>
	main {
		display: flex;
		height: 17px;
		margin-top: 6px;
	}
	img {
		width: 24px;
		height: 24px;
		margin-left: 4px;
		margin-top: 4px;
	}
	b {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		display: block;
		margin-left: 3.5px;
		font-size: 13.2px;
	}
</style>
