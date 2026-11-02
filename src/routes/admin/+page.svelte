<script lang="ts">
  import type { PageData } from "./$types";
  import { formatPrice } from "$lib/utils/format";
  import {
    Building,
    CheckCircle,
    Clock,
    Eye,
    Plus,
    ClipboardList,
    Users,
    ExternalLink,
    Image,
    Package,
    MapPin,
    FileText,
  } from "lucide-svelte";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
</script>

<div class="px-1 md:px-4 py-6 sm:px-0">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
    <p class="mt-2 text-sm text-gray-600">
      Welcome to the Villa Management System
    </p>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Building class="h-8 w-8 text-gray-400" />
          </div>
          <div class="ml-5 w-0 flex-1">
            <dt class="text-sm font-medium text-gray-500 truncate">
              Total Villas
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-900">
              {data?.stats?.totalVillas || 0}
            </dd>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <CheckCircle class="h-8 w-8 text-green-400" />
          </div>
          <div class="ml-5 w-0 flex-1">
            <dt class="text-sm font-medium text-gray-500 truncate">
              Published
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-green-600">
              {data?.stats?.published || 0}
            </dd>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Clock class="h-8 w-8 text-yellow-400" />
          </div>
          <div class="ml-5 w-0 flex-1">
            <dt class="text-sm font-medium text-gray-500 truncate">Drafts</dt>
            <dd class="mt-1 text-3xl font-semibold text-yellow-600">
              {data?.stats?.drafts || 0}
            </dd>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Eye class="h-8 w-8 text-blue-400" />
          </div>
          <div class="ml-5 w-0 flex-1">
            <dt class="text-sm font-medium text-gray-500 truncate">
              Total Views
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-blue-600">
              {data?.stats?.totalViews || 0}
            </dd>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Additional Stats -->
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <MapPin class="h-8 w-8 text-purple-400" />
          </div>
          <div class="ml-5 w-0 flex-1">
            <dt class="text-sm font-medium text-gray-500 truncate">
              Total Places
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-900">
              {data?.stats?.totalPlaces || 0}
            </dd>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <MapPin class="h-8 w-8 text-purple-600" />
          </div>
          <div class="ml-5 w-0 flex-1">
            <dt class="text-sm font-medium text-gray-500 truncate">
              Published Places
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-purple-600">
              {data?.stats?.publishedPlaces || 0}
            </dd>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <FileText class="h-8 w-8 text-orange-400" />
          </div>
          <div class="ml-5 w-0 flex-1">
            <dt class="text-sm font-medium text-gray-500 truncate">
              Total Posts
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-900">
              {data?.stats?.totalPosts || 0}
            </dd>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <FileText class="h-8 w-8 text-orange-600" />
          </div>
          <div class="ml-5 w-0 flex-1">
            <dt class="text-sm font-medium text-gray-500 truncate">
              Published Posts
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-orange-600">
              {data?.stats?.publishedPosts || 0}
            </dd>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="mb-8">
    <h2 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <a
        href="/admin/villas/new"
        class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <div>
          <span
            class="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-600 ring-4 ring-white"
          >
            <Plus class="h-6 w-6" />
          </span>
        </div>
        <div class="mt-4">
          <h3 class="text-lg font-medium text-gray-900">Add New Villa</h3>
          <p class="mt-2 text-sm text-gray-500">
            Create a new villa listing with photos and details
          </p>
        </div>
      </a>

      <a
        href="/admin/villas"
        class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <div>
          <span
            class="rounded-lg inline-flex p-3 bg-green-50 text-green-600 ring-4 ring-white"
          >
            <ClipboardList class="h-6 w-6" />
          </span>
        </div>
        <div class="mt-4">
          <h3 class="text-lg font-medium text-gray-900">Manage Villas</h3>
          <p class="mt-2 text-sm text-gray-500">
            View, edit, and organize all villa listings
          </p>
        </div>
      </a>

      <a
        href="/admin/users"
        class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <div>
          <span
            class="rounded-lg inline-flex p-3 bg-purple-50 text-purple-600 ring-4 ring-white"
          >
            <Users class="h-6 w-6" />
          </span>
        </div>
        <div class="mt-4">
          <h3 class="text-lg font-medium text-gray-900">User Management</h3>
          <p class="mt-2 text-sm text-gray-500">
            Manage admin users and permissions
          </p>
        </div>
      </a>

      <a
        href="/"
        target="_blank"
        class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <div>
          <span
            class="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 ring-4 ring-white"
          >
            <ExternalLink class="h-6 w-6" />
          </span>
        </div>
        <div class="mt-4">
          <h3 class="text-lg font-medium text-gray-900">View Public Site</h3>
          <p class="mt-2 text-sm text-gray-500">
            See how your villas appear to visitors
          </p>
        </div>
      </a>
    </div>
  </div>

  <!-- Recent Villas -->
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
      <div>
        <h3 class="text-lg leading-6 font-medium text-gray-900">
          Recent Villas
        </h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">Latest villa entries</p>
      </div>
      <a
        href="/admin/villas"
        class="text-sm text-indigo-600 hover:text-indigo-500"
      >
        View all →
      </a>
    </div>
    <ul class="divide-y divide-gray-200">
      {#each data?.recentVillas || [] as villa}
        <li>
          <a href="/admin/villas/{villa.id}" class="block hover:bg-gray-50">
            <div class="px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center flex-1">
                  {#if villa.firstImage}
                    <img
                      src={villa.firstImage.thumbnailUrl ||
                        villa.firstImage.imageUrl}
                      alt={villa.title}
                      class="h-12 w-12 rounded-lg object-cover mr-4"
                    />
                  {:else}
                    <div
                      class="h-12 w-12 rounded-lg bg-gray-200 mr-4 flex items-center justify-center"
                    >
                      <Image class="h-6 w-6 text-gray-400" />
                    </div>
                  {/if}
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-indigo-600 truncate">
                          {villa.title}
                        </p>
                        <div
                          class="mt-1 flex items-center text-sm text-gray-500"
                        >
                          <span
                            >{formatPrice(Number(villa.priceMin))} - {formatPrice(
                              Number(villa.priceMax),
                            )}</span
                          >
                          <span class="mx-2">•</span>
                          <span>{villa.bedrooms} BR</span>
                          <span class="mx-2">•</span>
                          <span>{villa.viewCount} views</span>
                        </div>
                        <p class="mt-1 text-xs text-gray-400">
                          Created {formatDate(villa.createdAt.toString())}
                        </p>
                      </div>
                      <div class="flex items-center space-x-4">
                        <span
                          class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            villa.status === "published"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {villa.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a>
        </li>
      {:else}
        <li class="px-4 py-8 text-center text-gray-500">
          <Package class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">No villas yet</h3>
          <p class="mt-1 text-sm text-gray-500">
            Get started by creating your first villa listing.
          </p>
          <div class="mt-6">
            <a
              href="/admin/villas/new"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus class="-ml-1 mr-2 h-5 w-5" />
              Add New Villa
            </a>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</div>
