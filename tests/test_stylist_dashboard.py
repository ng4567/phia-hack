import unittest

from app.utils import Client, Design, Stylist


class StylistDashboardTests(unittest.TestCase):
    def test_stylist_add_client_links_both_directions(self):
        stylist = Stylist(name="Ada", metadata={"aesthetic": "minimalist"})
        client = Client(name="Grace")

        stylist.add_client(client)

        self.assertEqual(client.stylist_id, stylist.id)
        self.assertIn(client, stylist.clients)
        self.assertIs(stylist.get_client(client.id), client)

    def test_add_design_for_client_records_design(self):
        stylist = Stylist(name="Ada")
        client = stylist.add_client(Client(name="Grace"))
        design = Design(image_urls=["https://example.com/out.png"], description="Look 1")

        stored = stylist.add_design_for_client(client.id, design)

        self.assertIs(stored, design)
        self.assertEqual(client.designs, [design])

    def test_add_design_for_unknown_client_raises(self):
        stylist = Stylist(name="Ada")
        with self.assertRaises(KeyError):
            stylist.add_design_for_client("nope", Design())

    def test_ids_are_unique_by_default(self):
        a = Stylist(name="A")
        b = Stylist(name="B")
        self.assertNotEqual(a.id, b.id)


if __name__ == "__main__":
    unittest.main()
