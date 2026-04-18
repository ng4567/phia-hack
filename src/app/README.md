Start backend with:

```bash
uv run dev
```

# Stylist Dashboard Feature

Stylists should be able to manage a portfolio of clients using Phia.

The stylist class links a stylist to all the clients they manage. It should be able to store metadata useful for agents who want to use that metadata to automatically make designs for customers.

The client class also links the client back to the stylist and contains all the designs the stylist made for them.

Store these classes inside utils.py
