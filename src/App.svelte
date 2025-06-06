<script lang="ts">
  import ArtSearch from "./lib/ArtSearch.svelte";

  // The Welcome component and its related logic (navigationType, welcome variable)
  // have been removed. The logo button no longer needs an on:click handler
  // to show the welcome screen.
</script>

<ArtSearch />

<div class="absolute top-4 left-4 sm:top-8 sm:left-8">
  <button class="logo-btn text-3xl fontvar-heading">My Portfolio</button>
</div>

<style lang="postcss">
  .logo-btn {
    outline: none;
    transition: text-shadow 200ms;
  }

  .logo-btn:hover {
    text-shadow: 0 0 6px rgba(0, 0, 0, 25%);
  }
</style>
