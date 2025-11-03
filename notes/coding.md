# 🧭 Coding Standards

Consistent, secure, and maintainable code enables reliability, clarity, and collaboration across all projects.

---

## ✅ **DO — Code Quality & Best Practices**

| Category                 | Guideline                                                                                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Security**             | Use secure coding practices — validate inputs, sanitize outputs, and handle errors safely. Never trust unverified data.                                                                      |
| **Design**               | Follow **SOLID**, **DRY**, **KISS**, and **YAGNI** principles. Prefer composition over deep inheritance.                                                                                     |
| **Structure**            | Keep functions small and low in complexity. Separate concerns clearly between logic, data, and presentation layers.                                                                          |
| **Testing & Validation** | Ensure code compiles and passes linting, type checks, and unit tests via pre-commit hooks and CI on push, merge, and PR. Write tests at multiple levels (unit, integration, property-based). |
| **Readability**          | Use clear, self-documenting names and consistent structure. Favor clarity over cleverness.                                                                                                   |
| **Documentation**        | Document _intent_ concisely — be conversational, not verbose. Explain **why**, not just **how**.                                                                                             |
| **Error Handling**       | Fail fast and loudly on errors; don’t hide exceptions or produce misleading outputs.                                                                                                         |
| **Performance**          | Be mindful of algorithmic efficiency (Big-O) and resource use (CPU, memory, I/O).                                                                                                            |
| **Maintainability**      | Write code that is easy to review, extend, and refactor. Keep it consistent and predictable.                                                                                                 |
| **Automation**           | Use pre-commit hooks and CI pipelines to enforce quality gates automatically.                                                                                                                |
| **Version Control**      | Commit small, meaningful changes with clear messages following [Conventional Commits](https://www.conventionalcommits.org/).                                                                 |
| **Style Consistency**    | Adhere to project style guides for formatting, naming, and conventions.                                                                                                                      |

---

## 🔧 **Language-Specific Guidelines**

### TypeScript

| Category           | Guideline                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **Type Safety**    | Enable `strict` mode. Use explicit types for public APIs. Prefer type narrowing over type assertions. |
| **Error Handling** | Use discriminated unions for error types. Avoid `any` — use `unknown` when type is truly unknown.     |
| **Async/Await**    | Always handle promise rejections. Use `Promise<Result<T, E>>` pattern for expected errors.            |
| **Security**       | Validate external data with runtime checks. Don't rely on TypeScript types alone at runtime.          |
| **Naming**         | Use PascalCase for types/interfaces, camelCase for variables/functions.                               |

### Python

| Category           | Guideline                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------- |
| **Type Hints**     | Use type hints for all public functions. Prefer `dataclass` over plain dicts for data models. |
| **Error Handling** | Raise specific exceptions. Use type guards with `isinstance()` for runtime validation.        |
| **Style**          | Follow PEP 8. Use consistent formatting and linting tools.                                    |
| **Security**       | Validate inputs explicitly with type checks and bounds validation. Avoid `eval()`/`exec()`.   |
| **Naming**         | Use snake_case for functions/variables, PascalCase for classes.                               |

---

## ❌ **DON'T — Common Pitfalls**

| Category           | Anti-Pattern                                                          |
| ------------------ | --------------------------------------------------------------------- |
| **Testing**        | Don’t fake or bypass tests to pass pipelines.                         |
| **Quality**        | Don’t ignore or suppress lint/type errors unless truly unavoidable.   |
| **Type Safety**    | Avoid unsafe, implicit, or overly broad generics.                     |
| **Design**         | Don’t over-engineer or add unused features “just in case.”            |
| **Error Handling** | Never swallow exceptions or return misleading results.                |
| **Complexity**     | Don’t sacrifice simplicity or readability for premature optimization. |

---

## 🧾 **Documentation Rules**

| Aspect          | Guideline                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Audience**    | Write for software architects and engineers — assume technical fluency.                                                                                                        |
| **Voice**       | Use a plain, conversational tone. Skip filler and jargon.                                                                                                                      |
| **Clarity**     | Be concise — aim for **3–7 bullets or ≤120 words** per section. **Exception:** Security-critical features (authentication, cryptography, key management) may expand as needed. |
| **Focus**       | Explain _intent_, not implementation details — capture rationale and design reasoning.                                                                                         |
| **Format**      | Use markdown headings, lists, and tables for readability.                                                                                                                      |
| **Maintenance** | Keep docs updated alongside code — outdated docs are worse than missing ones.                                                                                                  |

---

## 🧩 **Summary**

- Build for clarity, safety, and maintainability.
- Automate quality gates — lint, test, and type-check early.
- Communicate through code and documentation.
- Strive for simplicity — elegance follows discipline.
