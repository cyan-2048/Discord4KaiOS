<script>
	export let on = false;
</script>

<main class:on>
	<div class:on class="slide" />
</main>

<style lang="scss">
	@use "../assets/shared" as *;

	main {
		&::after,
		&::before {
			content: "";
			position: absolute;
			width: 100%;
			height: 100%;
			top: 0;
			left: 0;
			transition: opacity linear 0.2s;
		}

		&::before {
			background-image: url("/css/switch_off.png");
		}

		&::after {
			background-image: url("/css/switch_on.png");
			opacity: 0;
		}

		&.on::after {
			opacity: 1;
		}

		width: 40px;
		height: 24px;

		overflow: hidden;
		border-radius: 14px;
		position: relative;

		.slide {
			position: absolute;
			@include linearGradient(10%, rgba(229, 229, 228));
			background-color: rgba(169, 166, 160);
			box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.6);
			border-radius: 50px;
			width: 18px;
			height: 18px;
			border: 1px solid rgba(230, 230, 230, 0.6);
			top: 3px;
			z-index: 2;

			transition: left 0.2s ease;

			&.on {
				left: 19px;
			}

			&:not(.on) {
				left: 3px;
			}
		}
	}
</style>
