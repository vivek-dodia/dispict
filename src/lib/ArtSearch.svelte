<script lang="ts">
  import { onMount } from "svelte";
  import { cubicOut } from "svelte/easing";
  import { fade, fly } from "svelte/transition";
  import debounce from "lodash.debounce";

  import ArtImage from "./ArtImage.svelte";
  import SearchInput from "./SearchInput.svelte";
  import Sidebar from "./Sidebar.svelte";
  import { loadLocalImages, type Artwork } from "./api";
  import { layoutArtwork, PIXELS_PER_CM } from "./geometry";
  import { TouchZoom } from "./touchZoom";

  const SIDEBAR_WIDTH = 420;

  const STARTER_INPUTS = [
    "bright landscape",
    "drawing with freedom",
    "abstract painting",
    "muslim religious imagery",
    "everything I see is green",
    "friendship",
    "sunset over the ocean",
    "sturm und drang",
    "delicious fruit",
    "pablo picasso",
    "tokugawa japan",
    "turbulent waves",
    "tranquility",
    "vivid dreams",
    "baby jesus",
    "the light of god",
    "rainbow dreams",
    "urban planning",
    "oil paint flowers",
    "tender arguments",
    "john singer sargent",
    "feeling unseen",
  ];

  function randomInput(exclude?: string) {
    while (true) {
      const value =
        STARTER_INPUTS[Math.floor(Math.random() * STARTER_INPUTS.length)];
      if (value !== exclude) return value;
    }
  }

  let query = randomInput(); // @hmr:keep

  let frame: HTMLDivElement;
  let touchZoom: TouchZoom;
  let center = [0, 0];
  let zoom = 1;
  let lastMove = 0;

  let selected: Artwork | null = null;
  let allArtworks: Artwork[] = []; // Store all artworks loaded from JSON

  onMount(async () => {
    // Load all artworks once on mount
    await updateResults();

    touchZoom = new TouchZoom(frame);
    touchZoom.onMove((manual) => {
      center = touchZoom.center;
      zoom = touchZoom.zoom;
      if (manual) {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        lastMove = Date.now();
        selected = null;
      }
    });
  });

  function getTransform(pos: number[], center: number[], zoom: number): string {
    return `scale(${(zoom * 100).toFixed(3)}%) translate(
      ${pos[0] * PIXELS_PER_CM - center[0]}px,
      ${pos[1] * PIXELS_PER_CM - center[1]}px
    )`;
  }

  /** Adaptively adjust image size based on visibility and screen size. */
  function getDetail(
    artwork: Artwork,
    pos: number[],
    center: number[],
    zoom: number
  ): number {
    const pxBounding = [
      zoom * ((pos[0] - artwork.dimwidth / 2) * PIXELS_PER_CM - center[0]),
      zoom * ((pos[0] + artwork.dimwidth / 2) * PIXELS_PER_CM - center[0]),
      zoom * ((pos[1] - artwork.dimheight / 2) * PIXELS_PER_CM - center[1]),
      zoom * ((pos[1] + artwork.dimheight / 2) * PIXELS_PER_CM - center[1]),
    ];
    const windowSize = [
      -frame.clientWidth / 2,
      frame.clientWidth / 2,
      -frame.clientHeight / 2,
      frame.clientHeight / 2,
    ];
    const physicalWidth =
      window.devicePixelRatio * zoom * artwork.dimwidth * PIXELS_PER_CM;
    // Not visible, outside the window.
    if (
      pxBounding[0] > 1.15 * windowSize[1] ||
      pxBounding[1] < 1.15 * windowSize[0] ||
      pxBounding[2] > 1.15 * windowSize[3] ||
      pxBounding[3] < 1.15 * windowSize[2]
    ) {
      return 400;
    } else if (physicalWidth < 400) {
      return 400;
    } else if (physicalWidth < 800) {
      return 800;
    } else {
      return 4000; // full size
    }
  }

  /** Handle when an artwork is selected for more details. */
  function handleSelect(artwork: Artwork, pos: [number, number]) {
    if (lastMove < Date.now() - 50 && !touchZoom.isPinching) {
      const sidebarOffset =
        frame.clientWidth > SIDEBAR_WIDTH ? SIDEBAR_WIDTH : 0;
      const desiredZoom =
        0.8 *
        Math.min(
          frame.clientHeight / (artwork.dimheight * PIXELS_PER_CM),
          (frame.clientWidth - sidebarOffset) /
            (artwork.dimwidth * PIXELS_PER_CM)
        );

      touchZoom.moveTo(
        [
          pos[0] * PIXELS_PER_CM + (0.5 * sidebarOffset) / desiredZoom,
          pos[1] * PIXELS_PER_CM,
        ],
        desiredZoom
      );
      selected = artwork;
    }
  }

  let results: Artwork[] = []; // This will hold the filtered results
  let apiError: string | null = null;
  let searching = 0;
  // Abort controller might not be strictly necessary for local fetch,
  // but keeping it for now in case of future changes.
  let abortController = new AbortController();

  async function updateResults() {
    selected = null;
    searching++;
    // For local fetch, abortController might not be used in loadLocalImages
    // but it's good practice if the API could be slow or remote in the future.
    abortController.abort();
    const ctrl = new AbortController();
    abortController = ctrl;

    try {
      // Load all artworks. No query or signal needed for loadLocalImages.
      allArtworks = await loadLocalImages();
      apiError = null;
    } catch (error: any) {
      // Error handling for local file fetch
      if (!ctrl.signal.aborted) {
        apiError = "Error loading artwork data. Please check public/photos/metadata.json.";
        console.error(error);
      }
      allArtworks = []; // Ensure it's an empty array on error
    } finally {
      searching--;
    }
  }

  // No debounce needed if filtering is fast locally.
  // If allArtworks is large, debounce might be useful again.
  $: {
    if (!query) {
      results = allArtworks;
    } else {
      const lowerCaseQuery = query.toLowerCase();
      results = allArtworks.filter((artwork) => {
        return (
          artwork.title?.toLowerCase().includes(lowerCaseQuery) ||
          artwork.description?.toLowerCase().includes(lowerCaseQuery) ||
          artwork.people?.some(p => p.toLowerCase().includes(lowerCaseQuery)) ||
          artwork.dated?.toLowerCase().includes(lowerCaseQuery) ||
          artwork.culture?.toLowerCase().includes(lowerCaseQuery) ||
          artwork.department?.toLowerCase().includes(lowerCaseQuery) ||
          artwork.medium?.toLowerCase().includes(lowerCaseQuery) ||
          artwork.technique?.toLowerCase().includes(lowerCaseQuery) ||
          artwork.classification?.toLowerCase().includes(lowerCaseQuery)
        );
      });
    }
    // Reset selection when query changes and thus results change
    selected = null;
  }

  $: positions = layoutArtwork(results); // Use results directly
</script>

<main class="absolute inset-0 overflow-hidden bg-gray-50">
  <div
    class="w-full h-full flex justify-center items-center touch-none"
    bind:this={frame}
  >
    <div style:transform={getTransform([0, 0], center, zoom)}>
      <SearchInput
        bind:value={query}
        searching={searching > 0}
        on:refresh={() => (query = randomInput(query))}
      />
      {#if apiError}
        <p
          class="absolute text-center w-80 mt-3 p-1 rounded bg-red-500/20 text-red-800"
        >
          {apiError}
        </p>
      {/if}
    </div>

    {#each results as artwork, i (artwork.id)}
      {@const detail = getDetail(artwork, positions[i], center, zoom)}
      <div
        class="absolute"
        style:transform={getTransform(positions[i], center, zoom)}
        transition:fade
      >
        <button
          class="cursor-default"
          on:click={() => handleSelect(artwork, positions[i])}
          on:touchend={() => handleSelect(artwork, positions[i])}
        >
          <ArtImage
            artwork={artwork}
            {detail}
            grayed={Boolean(selected) && selected !== artwork}
          />
        </button>
      </div>
    {/each}
  </div>
</main>

{#if selected}
  <aside
    class="absolute z-20 inset-y-0 right-0 bg-stone-900 shadow-2xl overflow-y-auto"
    style:width="calc(min(100vw, {SIDEBAR_WIDTH}px))"
    transition:fly={{ x: SIDEBAR_WIDTH, y: 0, duration: 300, easing: cubicOut }}
  >
    <Sidebar artwork={selected} on:close={() => (selected = null)} />
  </aside>
{/if}
