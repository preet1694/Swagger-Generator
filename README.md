# 🚀 Swagger Generator CLI

**Generate beautiful Swagger (OpenAPI 3.0) documentation from your Express/Node.js app automatically — using code inspection and/or JSDoc comments.**

![npm](https://img.shields.io/npm/v/swagger-autogen-cli?color=green)
![license](https://img.shields.io/npm/l/swagger-autogen-cli)
![node-current](https://img.shields.io/node/v/swagger-autogen-cli)

---

## 📦 What is `swagger-generator`?

`swagger-generator` is a CLI tool that scans your Express or Node.js backend, detects routes, controllers, and JSDoc-based `@swagger` annotations, and generates a complete Swagger (OpenAPI 3.0) specification — in **JSON or YAML**.

---

## ✨ Features

* ✅ Supports both **JavaScript** and **TypeScript**
* ✅ Parses **routes**, **methods**, **parameters**, and **controllers**
* ✅ Supports `@swagger` JSDoc annotations
* ✅ Outputs Swagger docs in **JSON** or **YAML**
* ✅ Handles **middlewares**, nested routers, and controller functions
* ✅ CLI-based — no changes required in app code
* ✅ Merges **custom annotations** with fallback detection

---

## 📦 Installation

```bash
npm install -g swagger-autogen-cli
```

Or run directly via:

```bash
npx swagger-generator ./routes ./controllers --out swagger.yaml
```

---

## 📁 Project Structure

```
my-app/
├── routes/
│   └── user.routes.js
├── controllers/
│   └── user.controller.js
├── app.js
```

---

## 🚀 Usage

```bash
swagger-generator <routesDir> <controllersDir> [options]
```

### Example:

```bash
swagger-generator ./src/routes ./src/controllers --out swagger.json
```

---

## 🔧 CLI Options

| Option             | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `<routesDir>`      | Path to your routes directory (required)             |
| `<controllersDir>` | Path to your controllers directory (required)        |
| `--out <file>`     | Output file (e.g., `swagger.yaml` or `swagger.json`) |
| `--format <type>`  | Output format: `json` or `yaml` (default: `json`)    |
| `--preferJsdoc`    | Prefer `@swagger` JSDoc over AST route analysis      |
| `--includeAuth`    | Detect auth middlewares and mark routes as secured   |

---

## 🧐 Example JSDoc Block

```js
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', userController.getUsers);
```

---

## 📄 Sample Output

```yaml
openapi: 3.0.0
info:
  title: Express API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get all users
      responses:
        '200':
          description: List of users
```

---

## 💡 When to Use

✅ You want **zero-code-integration** Swagger generation
✅ You have an existing Express/Node app
✅ You want fast, reproducible OpenAPI docs for Swagger UI, Redoc, or Postman

---

## 🧪 Test Locally

```bash
git clone https://github.com/preet1694/Swagger-Generator.git
cd swagger-generator
npm install
npm link

swagger-generator ./routes ./controllers --out swagger.yaml
```

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork this repo
2. Create a feature branch
3. Submit a PR with a clear description

---

## 🛡 License

MIT © Preet Brahmbhatt

---

## 🌐 Related Tools

* [Swagger UI](https://swagger.io/tools/swagger-ui/)
* [Redoc](https://github.com/Redocly/redoc)
* [OpenAPI Spec](https://swagger.io/specification/)
