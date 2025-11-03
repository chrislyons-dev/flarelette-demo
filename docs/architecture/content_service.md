# content-service

[← Back to System Overview](./README.md)

---

## Container Context

![Container Diagram](./diagrams/structurizr-Containers.png)

---

## Container Information

<table>
<tbody>
<tr>
<td><strong>Name</strong></td>
<td>content-service</td>
</tr>
<tr>
<td><strong>Type</strong></td>
<td><code>Cloudflare Worker</code></td>
</tr>
<tr>
<td><strong>Description</strong></td>
<td>Cloudflare Worker: content-service | Content management service - news, events, pages (D1-backed)</td>
</tr>
<tr>
<td><strong>Tags</strong></td>
<td><code>cloudflare</code>, <code>worker</code></td>
</tr>
</tbody>
</table>

---

## Components

### Component View

![Component Diagram](./diagrams/structurizr-Components_content_service.png)

### Component Details

<table>
<thead>
<tr>
<th>Component</th>
<th>Type</th>
<th>Description</th>
<th>Code</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>env</strong></td>
<td><code>module</code></td>
<td>Environment bindings for Content Service</td>
<td><a href="./content_service__env.md">View →</a></td>
</tr>
<tr>
<td><strong>main</strong></td>
<td><code>module</code></td>
<td>Content Service

CMS microservice for news, events, roster, pages.
All endpoints require internal JWT verification.</td>

<td><a href="./content_service__main.md">View →</a></td>
</tr>
</tbody>
</table>

---

<div align="center">
<sub><a href="./README.md">← Back to System Overview</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>
