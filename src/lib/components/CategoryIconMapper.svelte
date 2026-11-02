<script lang="ts">
  import type { AmenityCategory } from "$lib/utils/amenity-categories";

  // Import existing icons
  import AirCondIcon from "$lib/components/icons/AirCondIcon.svelte";
  import PlateIcon from "$lib/components/icons/PlateIcon.svelte";
  import BreakfastIcon from "$lib/components/icons/BreakfastIcon.svelte";
  import TvIcon from "$lib/components/icons/TvIcon.svelte";
  import BathtubIcon from "$lib/components/icons/BathtubIcon.svelte";

  // Import new category icons
  import SceneryIcon from "$lib/components/icons/SceneryIcon.svelte";
  import PoolIcon from "$lib/components/icons/PoolIcon.svelte";
  import WifiIcon from "$lib/components/icons/WifiIcon.svelte";
  import ParkingIcon from "$lib/components/icons/ParkingIcon.svelte";
  import AccessIcon from "$lib/components/icons/AccessIcon.svelte";
  import WelcomeComplimentaryIcon from "$lib/components/icons/WelcomeComplimentaryIcon.svelte";
  import EquipmentComplimentaryIcon from "$lib/components/icons/EquipmentComplimentaryIcon.svelte";
  import HousekeepingIcon from "$lib/components/icons/HousekeepingIcon.svelte";
  import KitchenIcon from "$lib/components/icons/KitchenIcon.svelte";
  import DiningIcon from "$lib/components/icons/DiningIcon.svelte";
  import FitnessIcon from "$lib/components/icons/FitnessIcon.svelte";
  import SecurityIcon from "$lib/components/icons/SecurityIcon.svelte";
  import HotCoffeeIcon from "./icons/HotCoffeeIcon.svelte";
  import CircelUserIcon from "$lib/components/icons/CircelUserIcon.svelte";
  import IceCreamIcon from "./icons/IceCreamIcon.svelte";
  import WineIcon from "./icons/WineIcon.svelte";

  export let category: AmenityCategory;
  export let size: number = 24;
  export let className: string = "h-4 w-4";

  // Map categories to their corresponding icon components
  const categoryIconMap = {
    scenery: SceneryIcon,
    pool: PoolIcon,
    breakfast: BreakfastIcon,
    connectivity: WifiIcon,
    parking: ParkingIcon,
    bathroom: BathtubIcon,
    access: AccessIcon,
    "welcome-complimentary": WineIcon,
    "equipment-complimentary": EquipmentComplimentaryIcon,
    housekeeping: CircelUserIcon,
    kitchen: KitchenIcon,
    AC: AirCondIcon,
    dining: DiningIcon,
    fitness: FitnessIcon,
    entertainment: TvIcon,
    security: SecurityIcon,
    resto: HotCoffeeIcon,
  };

  // Get the icon component for the category, fallback to SceneryIcon
  $: IconComponent = categoryIconMap[category] || SceneryIcon;
</script>

<svelte:component this={IconComponent} {size} {className} />
