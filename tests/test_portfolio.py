import unittest

from app.utils import Client, Design, Stylist


class DesignTests(unittest.TestCase):
    def test_design_stores_output_urls_and_garment(self):
        design = Design(
            output_urls=["https://cdn.example.com/out1.png"],
            garment_image_path="/tmp/shirt.png",
        )
        self.assertEqual(design.output_urls, ["https://cdn.example.com/out1.png"])
        self.assertEqual(design.garment_image_path, "/tmp/shirt.png")
        self.assertIsNone(design.notes)

    def test_design_stores_optional_notes(self):
        design = Design(
            output_urls=["https://cdn.example.com/out2.png"],
            garment_image_path="/tmp/dress.png",
            notes="Looks great for the gala",
        )
        self.assertEqual(design.notes, "Looks great for the gala")


class ClientTests(unittest.TestCase):
    def test_client_initialises_with_empty_images_and_designs(self):
        client = Client(name="Alice")
        self.assertEqual(client.name, "Alice")
        self.assertEqual(client.images, [])
        self.assertEqual(client.designs, [])
        self.assertIsNone(client.client_id)

    def test_add_image_appends_to_images(self):
        client = Client(name="Bob")
        client.add_image("/photos/bob_front.png")
        client.add_image("/photos/bob_side.png")
        self.assertEqual(client.images, ["/photos/bob_front.png", "/photos/bob_side.png"])

    def test_add_design_appends_to_designs(self):
        client = Client(name="Carol")
        design = Design(
            output_urls=["https://cdn.example.com/carol_out.png"],
            garment_image_path="/tmp/jacket.png",
        )
        client.add_design(design)
        self.assertEqual(len(client.designs), 1)
        self.assertIs(client.designs[0], design)

    def test_client_stores_optional_id(self):
        client = Client(name="Dana", client_id="client-42")
        self.assertEqual(client.client_id, "client-42")


class StylistTests(unittest.TestCase):
    def test_stylist_initialises_with_empty_portfolio(self):
        stylist = Stylist(name="Eve")
        self.assertEqual(stylist.name, "Eve")
        self.assertEqual(stylist.portfolio, {})
        self.assertIsNone(stylist.stylist_id)

    def test_add_client_stores_client_in_portfolio(self):
        stylist = Stylist(name="Frank")
        client = Client(name="Grace")
        stylist.add_client(client)
        self.assertIn("Grace", stylist.portfolio)
        self.assertIs(stylist.portfolio["Grace"], client)

    def test_add_client_raises_value_error_for_duplicate_name(self):
        stylist = Stylist(name="Frank")
        stylist.add_client(Client(name="Grace"))
        with self.assertRaises(ValueError):
            stylist.add_client(Client(name="Grace"))

    def test_get_client_returns_correct_client(self):
        stylist = Stylist(name="Hank")
        client = Client(name="Ivy")
        stylist.add_client(client)
        self.assertIs(stylist.get_client("Ivy"), client)

    def test_get_client_returns_none_for_unknown_name(self):
        stylist = Stylist(name="Jack")
        self.assertIsNone(stylist.get_client("Unknown"))

    def test_remove_client_deletes_from_portfolio(self):
        stylist = Stylist(name="Kate")
        client = Client(name="Leo")
        stylist.add_client(client)
        stylist.remove_client("Leo")
        self.assertNotIn("Leo", stylist.portfolio)

    def test_remove_client_raises_key_error_for_unknown_name(self):
        stylist = Stylist(name="Mia")
        with self.assertRaises(KeyError):
            stylist.remove_client("Nobody")

    def test_stylist_can_manage_multiple_clients(self):
        stylist = Stylist(name="Nina", stylist_id="stylist-1")
        clients = [Client(name=n) for n in ("Oliver", "Pam", "Quinn")]
        for c in clients:
            stylist.add_client(c)
        self.assertEqual(len(stylist.portfolio), 3)
        self.assertEqual(stylist.stylist_id, "stylist-1")

    def test_designs_are_independent_per_client(self):
        stylist = Stylist(name="Rosa")
        c1 = Client(name="Sam")
        c2 = Client(name="Tina")
        stylist.add_client(c1)
        stylist.add_client(c2)

        d1 = Design(output_urls=["https://cdn.example.com/sam.png"], garment_image_path="/tmp/top.png")
        d2 = Design(output_urls=["https://cdn.example.com/tina.png"], garment_image_path="/tmp/skirt.png")
        stylist.get_client("Sam").add_design(d1)
        stylist.get_client("Tina").add_design(d2)

        self.assertEqual(len(stylist.get_client("Sam").designs), 1)
        self.assertEqual(len(stylist.get_client("Tina").designs), 1)
        self.assertIsNot(
            stylist.get_client("Sam").designs[0],
            stylist.get_client("Tina").designs[0],
        )


if __name__ == "__main__":
    unittest.main()
