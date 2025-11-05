# main — Code View

[← Back to Container](./content_service.md) | [← Back to System](./README.md)

---

## Component Information

<table>
<tbody>
<tr>
<td><strong>Component</strong></td>
<td>main</td>
</tr>
<tr>
<td><strong>Container</strong></td>
<td>content-service</td>
</tr>
<tr>
<td><strong>Type</strong></td>
<td><code>module</code></td>
</tr>
<tr>
<td><strong>Description</strong></td>
<td>Content Service

CMS microservice for news, events, roster, pages.
All endpoints require internal JWT verification.</td>

</tr>
</tbody>
</table>

---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_content_service__main.png)

### Code Elements

<details>
<summary><strong>2 code element(s)</strong></summary>

#### Functions

##### `getJwtConfig()`

Get or create JWT config (lazily initialized from environment)

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>private</code></td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>any</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-demo/workers/content-service/src/index.ts:22</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `env`: <code>import("C:/Users/chris/git/flarelette-demo/workers/content-service/src/env").Env</code>

---

##### `authGuard()`

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>private</code></td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>(c: Context<{ Bindings: import("C:/Users/chris/git/flarelette-demo/workers/content-service/src/env").Env; Variables: { auth: JwtPayload; }; }>, next: Next) => Promise<any></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-demo/workers/content-service/src/index.ts:38</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `policyObj`: <code>Policy</code>

---

</details>

---

<div align="center">
<sub><a href="./content_service.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>
