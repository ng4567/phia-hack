"""Hard-coded POC retailer allowlist.

Only Shopify storefronts whose public ``/products.json`` and
``/collections/<handle>/products.json`` feeds are reachable without bot
protection. See ``plan.md`` section 16 for probe results.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Retailer:
    id: str
    name: str
    base: str
    collections: dict[str, str]


POC_RETAILERS: dict[str, Retailer] = {
    r.id: r
    for r in (
        Retailer(
            id="allbirds",
            name="Allbirds",
            base="https://www.allbirds.com",
            collections={
                "womens_new": "womens-new-arrivals",
                "mens_new": "mens-new-arrivals",
            },
        ),
        Retailer(
            id="everlane",
            name="Everlane",
            base="https://www.everlane.com",
            collections={
                "womens_new": "womens-new-arrivals",
                "mens_new": "mens-new-arrivals",
            },
        ),
        Retailer(
            id="kith",
            name="Kith",
            base="https://kith.com",
            collections={
                "womens_new": "womens-new-arrivals",
                "mens_new": "mens-new-arrivals",
            },
        ),
        Retailer(
            id="naked_wolfe",
            name="Naked Wolfe",
            base="https://www.nakedwolfe.com",
            collections={"new": "new-arrivals"},
        ),
        Retailer(
            id="frank_and_oak",
            name="Frank And Oak",
            base="https://www.frankandoak.com",
            collections={"new": "new-arrivals"},
        ),
        Retailer(
            id="tentree",
            name="Tentree",
            base="https://www.tentree.com",
            collections={"new": "new-arrivals"},
        ),
        Retailer(
            id="outdoor_voices",
            name="Outdoor Voices",
            base="https://www.outdoorvoices.com",
            collections={"new": "new-arrivals"},
        ),
        Retailer(
            id="marine_layer",
            name="Marine Layer",
            base="https://www.marinelayer.com",
            collections={"new": "new-arrivals"},
        ),
        Retailer(
            id="taylor_stitch",
            name="Taylor Stitch",
            base="https://www.taylorstitch.com",
            collections={"new": "new-arrivals"},
        ),
    )
}


def retailer_summary() -> str:
    """Human-readable list of allow-listed retailers for agent prompts."""
    return ", ".join(r.name for r in POC_RETAILERS.values())
