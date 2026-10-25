// Standalone examples: no dependency on a practice task, hidden solution or
// an implementation of solve that the reader has not been shown.
function question(prompt, code, correct, wrong, explanation) {
  return { prompt, code, options: [correct, ...wrong], answer: 0, explanation };
}
export const appliedValueFixtures = [];
function value(code, expected, wrong, explanation) {
  appliedValueFixtures.push({ code, expected });
  return question('Какое значение будет в result после выполнения всего показанного кода?', code, JSON.stringify(expected), wrong.map(v => JSON.stringify(v)), explanation);
}
const rows = {
  'javascript-start': [
    value('function greeting() {\n  return "Привет!";\n}\nconst result = greeting();', 'Привет!', ['greeting', null], 'Вызов greeting() получает строку из return.'),
    value('function message() {\n  console.log("Начало");\n  return "Готово";\n}\nconst result = message();', 'Готово', ['Начало', 'НачалоГотово'], 'console.log выводит «Начало» в консоль, а return передаёт «Готово» в result.'),
  ],
  'javascript-values': [
    value('let score = 4;\nscore = score + 3;\nconst result = score;', 7, [4, 43], 'let допускает присваивание: 4 + 3 равно 7.'),
    value('const price = 12;\nconst quantity = 3;\nconst result = price * quantity;', 36, [15, 123], 'Оператор * перемножает два числа: 12 × 3 = 36.'),
  ],
  'javascript-numbers': [
    value('const result = 2 + 3 * 4;', 14, [20, 24], 'Умножение выполняется раньше сложения: 2 + 12.'),
    value('const result = Math.round(19.995 * 100);', 2000, [1999, 20], 'После умножения и округления получаем целое число сотых: 2000.'),
  ],
  'javascript-strings': [
    value('const name = "  Анна  ";\nconst result = name.trim().toUpperCase();', 'АННА', ['  АННА  ', 'Анна'], 'trim убирает внешние пробелы, затем toUpperCase переводит буквы в верхний регистр.'),
    value('const text = "JavaScript";\nconst result = text.slice(0, 4);', 'Java', ['JavaS', 'Script'], 'slice включает индекс 0 и исключает индекс 4.'),
  ],
  'javascript-conditions': [
    value('const age = 16;\nlet access = "закрыт";\nif (age >= 18) {\n  access = "открыт";\n}\nconst result = access;', 'закрыт', ['открыт', true], '16 >= 18 ложно, поэтому присваивание внутри if не выполняется.'),
    value('const count = 0;\nconst result = count || 10;', 10, [0, true], 'Ноль — falsy, поэтому || возвращает правый операнд 10.'),
  ],
  'javascript-loops': [
    value('let sum = 0;\nfor (let n = 1; n <= 3; n++) {\n  sum += n;\n}\nconst result = sum;', 6, [3, 7], 'Цикл прибавит 1, 2 и 3: сумма равна 6.'),
    value('let text = "";\nfor (const letter of "JS") {\n  text += letter + "!";\n}\nconst result = text;', 'J!S!', ['JS!', 'JS'], 'К каждой из двух букв добавляется восклицательный знак.'),
  ],
  'javascript-functions': [
    value('function square(value) {\n  return value * value;\n}\nconst result = square(5);', 25, [10, 5], 'Параметр value равен 5, возвращается 5 × 5.'),
    value('function add(a, b = 2) {\n  return a + b;\n}\nconst result = add(3);', 5, [3, 2], 'Второй аргумент не передан, поэтому используется значение по умолчанию 2.'),
  ],
  'javascript-arrays': [
    value('const values = [1, 2, 3, 4];\nconst result = values.filter(n => n > 2).map(n => n * 10);', [30, 40], [[10, 20, 30, 40], [3, 4]], 'filter оставляет 3 и 4; map умножает каждый оставшийся элемент на 10.'),
    value('const values = [2, 3, 4];\nconst result = values.reduce((sum, n) => sum + n, 1);', 10, [9, 24], 'Начальное значение суммы — 1, затем добавляются 2, 3 и 4.'),
  ],
  'javascript-objects': [
    value('const user = { name: "Лена", settings: { theme: "light" } };\nconst copy = { ...user };\ncopy.settings.theme = "dark";\nconst result = user.settings.theme;', 'dark', ['light', null], 'Spread копирует верхний уровень; вложенный settings остаётся общей ссылкой.'),
    value('const user = { name: "Марк" };\nconst { name, role = "student" } = user;\nconst result = role;', 'student', ['Марк', null], 'Свойства role нет, поэтому деструктуризация берёт значение по умолчанию.'),
  ],
  'javascript-collections': [
    value('const values = new Set(["JS", "TS", "JS"]);\nconst result = values.size;', 2, [3, 1], 'Set содержит два различных значения: JS и TS.'),
    value('const scores = new Map();\nscores.set("Анна", 2);\nscores.set("Анна", 5);\nconst result = scores.get("Анна");', 5, [2, 7], 'Повторный set с тем же ключом заменяет значение.'),
  ],
  'javascript-closures': [
    value('function counter() {\n  let n = 0;\n  return () => ++n;\n}\nconst next = counter();\nnext();\nconst result = next();', 2, [1, 0], 'Оба вызова next используют одну и ту же сохранённую переменную n.'),
    value('const user = {\n  name: "Оля",\n  greet() { return this.name; }\n};\nconst result = user.greet();', 'Оля', ['user', null], 'При вызове user.greet() значением this является user.'),
  ],
  'javascript-classes': [
    value('class Counter {\n  constructor(n) { this.n = n; }\n  increment() { this.n += 1; }\n}\nconst counter = new Counter(4);\ncounter.increment();\nconst result = counter.n;', 5, [4, 1], 'Конструктор сохраняет 4, метод increment увеличивает значение до 5.'),
    value('class Animal { speak() { return "звук"; } }\nclass Cat extends Animal { speak() { return "мяу"; } }\nconst result = new Cat().speak();', 'мяу', ['звук', 'Cat'], 'Метод speak переопределён в Cat, поэтому вызывается версия подкласса.'),
  ],
  'javascript-errors': [
    value('let result;\ntry {\n  result = JSON.parse("broken");\n} catch {\n  result = "ошибка";\n}', 'ошибка', [null, {}], 'JSON.parse выбрасывает SyntaxError, и catch присваивает строку.'),
    value('function read() {\n  try { return 1; }\n  finally { console.log("готово"); }\n}\nconst result = read();', 1, ['готово', null], 'finally выводит сообщение, но без собственного return не меняет результат 1.'),
  ],
  'javascript-async': [
    value('async function double(n) { return n * 2; }\nconst result = await double(4);', 8, [4, 'Promise'], 'await получает значение, которым выполнится Promise: 4 × 2.'),
    value('const first = Promise.resolve("A");\nconst second = Promise.resolve("B");\nconst result = await Promise.all([second, first]);', ['B', 'A'], [['A', 'B'], 'BA'], 'Promise.all сохраняет порядок переданного массива: second, затем first.'),
  ],
  'javascript-modules': [
    question('Какое значение выведет main.js? Оба файла находятся в одной папке и запускаются как ES-модули.', '// math.js\nexport const base = 10;\nexport function add(n) { return base + n; }\n\n// main.js\nimport { add } from "./math.js";\nconsole.log(add(3));', '13', ['3', 'ReferenceError'], 'Именованный импорт add сохраняет доступ к base из модуля math.js.'),
    question('Какой импорт позволяет получить строку «Привет» из показанного файла message.js в браузерном ESM?', '// message.js\nexport default "Привет";', 'import message from "./message.js";', ['import { message } from "./message.js";', 'const message = require("message");'], 'Значение экспортировано как default; локальное имя message выбирает импортирующий модуль.'),
  ],
  'javascript-event-loop': [
    question('В каком порядке появятся три сообщения в консоли? Код выполняется как одна задача.', 'console.log("A");\nPromise.resolve().then(() => console.log("B"));\nconsole.log("C");', 'A, C, B', ['A, B, C', 'B, A, C'], 'Сначала выполняется синхронный код A и C, затем микрозадача B.'),
    question('В каком порядке появятся сообщения? Код выполняется в браузере, других задач нет.', 'setTimeout(() => console.log("таймер"), 0);\nPromise.resolve().then(() => console.log("промис"));\nconsole.log("сразу");', 'сразу, промис, таймер', ['сразу, таймер, промис', 'таймер, промис, сразу'], 'После синхронного сообщения обрабатываются микрозадачи и лишь затем задача таймера.'),
  ],
  'javascript-dom': [
    value('const element = document.createElement("p");\nelement.textContent = "<b>Привет</b>";\nconst result = element.querySelector("b");', null, ['Привет', '<b>Привет</b>'], 'textContent вставляет обычный текст; дочерний элемент b не создаётся.'),
    value('const parent = document.createElement("div");\nconst child = document.createElement("span");\nparent.append(child);\nparent.append(child);\nconst result = parent.children.length;', 1, [2, 0], 'Повторный append перемещает существующий узел, не создавая копию.'),
  ],
  'javascript-events': [
    value('const button = document.createElement("button");\nlet clicks = 0;\nbutton.addEventListener("click", () => clicks++);\nbutton.click();\nbutton.click();\nconst result = clicks;', 2, [0, 1], 'Каждый из двух click синхронно вызывает зарегистрированный обработчик.'),
    value('const event = new Event("submit", { cancelable: true });\nevent.preventDefault();\nconst result = event.defaultPrevented;', true, [false, null], 'У отменяемого события preventDefault устанавливает defaultPrevented в true.'),
  ],
  'javascript-fetch': [
    value('const response = new Response("Не найдено", { status: 404 });\nconst result = response.ok;', false, [true, 404], 'ok истинен только для статусов от 200 до 299; здесь статус 404.'),
    value('const controller = new AbortController();\ncontroller.abort();\nconst result = controller.signal.aborted;', true, [false, null], 'После abort соответствующий signal имеет aborted: true.'),
  ],
  'javascript-storage': [
    value('localStorage.setItem("quiz-demo", JSON.stringify({ score: 7 }));\nconst saved = localStorage.getItem("quiz-demo");\nconst result = JSON.parse(saved).score;\nlocalStorage.removeItem("quiz-demo");', 7, ['7', null], 'Хранилище возвращает JSON-строку, JSON.parse восстанавливает объект с числом 7.'),
    value('localStorage.setItem("quiz-number", 42);\nconst result = typeof localStorage.getItem("quiz-number");\nlocalStorage.removeItem("quiz-number");', 'string', ['number', 'object'], 'localStorage сохраняет и возвращает строки, даже если setItem получил число.'),
  ],
  'javascript-dates-regexp': [
    value('const date = new Date("2025-01-02T00:00:00Z");\nconst result = date.toISOString();', '2025-01-02T00:00:00.000Z', ['2025-02-01T00:00:00.000Z', '2025-01-02'], 'ISO-формат использует UTC и включает время с миллисекундами.'),
    value('const pattern = /^JS\\d{2}$/;\nconst result = pattern.test("JS42");', true, [false, 'JS42'], 'Вся строка соответствует шаблону: JS и ровно две цифры.'),
  ],
  'javascript-testing': [
    question('Завершится ли проверка успешно? Файл выполняется в Node.js.', 'const assert = require("node:assert/strict");\nfunction add(a, b) { return a + b; }\nassert.equal(add(2, 3), 5);', 'Да, ожидаемое и фактическое значения равны 5', ['Нет, add вернёт 23', 'Нет, assert.equal сравнивает только строки'], '2 и 3 — числа; add возвращает 5, что совпадает с ожиданием.'),
    question('Какой вызов проверит глубокое равенство и не выбросит ошибку в Node.js?', 'const assert = require("node:assert/strict");\nconst actual = { tags: ["JS"] };\nconst expected = { tags: ["JS"] };', 'assert.deepEqual(actual, expected);', ['assert.equal(actual, expected);', 'assert.equal(actual.tags, expected.tags);'], 'Два разных объекта и массива равны по содержимому, но не по ссылке. deepEqual сравнивает содержимое.'),
  ],
  'typescript-types': [
    value('const price: number = 12;\nconst count: number = 3;\nconst result: number = price * count;', 36, [15, '36'], 'Аннотации не меняют вычисление: два числа перемножаются.'),
    question('Какой тип TypeScript выведет для переменной label?', 'let label = "JS";', 'string', ['number', 'boolean'], 'У изменяемой переменной let со строковым начальным значением выводится string.'),
  ],
  'typescript-unions': [
    value('function size(value: string | number) {\n  if (typeof value === "string") return value.length;\n  return value;\n}\nconst result = size("JS");', 2, ['JS', 0], 'typeof сужает value до string, длина строки JS равна 2.'),
    question('Какое выражение допустимо в показанной ветви после проверки typeof?', 'function show(value: string | number) {\n  if (typeof value === "number") {\n    // Выберите выражение для этой ветви.\n  }\n}', 'value.toFixed(2)', ['value.toUpperCase()', 'value.length'], 'Внутри ветви value имеет тип number, поэтому доступен числовой метод toFixed.'),
  ],
  'typescript-interfaces': [
    value('interface User { name: string; age?: number }\nconst user: User = { name: "Ира" };\nconst result = user.age ?? 18;', 18, [0, null], 'Необязательное age отсутствует; ?? подставляет 18 вместо undefined.'),
    question('Какой объект соответствует показанному интерфейсу без изменения типов?', 'interface Book { title: string; pages: number }', '{ title: "JS", pages: 100 }', ['{ title: "JS", pages: "100" }', '{ title: "JS" }'], 'Оба свойства обязательны: title — строка, pages — число.'),
  ],
  'typescript-functions': [
    value('function greet(name: string, prefix = "Привет"): string {\n  return `${prefix}, ${name}`;\n}\nconst result = greet("Анна");', 'Привет, Анна', ['undefined, Анна', 'Анна'], 'Пропущенный prefix получает строку по умолчанию «Привет».'),
    question('Какой вызов соответствует типу функции sum?', 'function sum(a: number, b: number): number {\n  return a + b;\n}', 'sum(2, 3)', ['sum("2", "3")', 'sum(2)'], 'Нужны два обязательных числовых аргумента.'),
  ],
  'typescript-tuples': [
    value('const pair: [string, number] = ["JS", 4];\nconst result = pair[1] + 1;', 5, ['JS1', 4], 'На позиции 1 кортежа находится число 4.'),
    question('Какое присваивание соответствует показанному типу Status?', 'type Status = "draft" | "published";', 'const status: Status = "draft";', ['const status: Status = "deleted";', 'const status: Status = 1;'], 'Union допускает только две перечисленные строки.'),
  ],
  'typescript-generics': [
    value('function first<T>(values: T[]): T | undefined {\n  return values[0];\n}\nconst result = first([10, 20]);', 10, [20, [10, 20]], 'T выводится как number; функция возвращает первый элемент 10.'),
    question('Какой тип имеет переменная result?', 'function identity<T>(value: T): T { return value; }\nconst result = identity<string>("JS");', 'string', ['number', 'unknown'], 'Явно переданный параметр типа string определяет тип аргумента и результата.'),
  ],
  'typescript-keyof': [
    question('Какое значение можно присвоить переменной key?', 'type User = { name: string; age: number };\nlet key: keyof User;', '"name"', ['"email"', '42'], 'keyof User — объединение ключей "name" | "age".'),
    question('Какой тип имеет Age?', 'type User = { name: string; age: number };\ntype Age = User["age"];', 'number', ['string', '"age"'], 'Индексный доступ к типу получает тип свойства age.'),
  ],
  'typescript-utility': [
    question('Какой объект допустим для типа Patch?', 'interface User { name: string; age: number }\ntype Patch = Partial<User>;', '{ age: 20 }', ['{ age: "20" }', '{ email: "a@b.ru" }'], 'Partial делает существующие поля необязательными, но сохраняет их типы.'),
    question('Какое присваивание допустимо для типа NameOnly?', 'interface User { name: string; age: number }\ntype NameOnly = Pick<User, "name">;', 'const value: NameOnly = { name: "Ира" };', ['const value: NameOnly = { age: 20 };', 'const value: NameOnly = { name: 20 };'], 'Pick оставляет только обязательное строковое поле name.'),
  ],
  'typescript-mapped': [
    question('Какой тип получится в Flags?', 'type Flags = { [K in "read" | "write"]: boolean };', '{ read: boolean; write: boolean }', ['{ read: string; write: string }', 'boolean[]'], 'Mapped type создаёт оба свойства с указанным типом boolean.'),
    question('Какой тип получится в Result?', 'type IsString<T> = T extends string ? "yes" : "no";\ntype Result = IsString<number>;', '"no"', ['"yes"', 'number'], 'number не расширяет string, поэтому выбирается ложная ветвь conditional type.'),
  ],
  'typescript-unknown': [
    value('function length(value: unknown): number {\n  if (typeof value === "string") return value.length;\n  return 0;\n}\nconst result = length(42);', 0, [2, 42], 'Число не проходит проверку на string, поэтому выполняется return 0.'),
    question('Почему обращение value.name в отмеченной строке не компилируется?', 'function read(value: unknown) {\n  return value.name; // Ошибка TypeScript\n}', 'Тип unknown нужно проверить перед доступом к свойствам', ['Свойства объектов всегда запрещены в TypeScript', 'Нужно заменить return на console.log'], 'unknown не обещает объект с name; требуется runtime-проверка и сужение типа.'),
  ],
  'typescript-classes': [
    value('class Counter {\n  constructor(public value: number) {}\n  add(n: number): void { this.value += n; }\n}\nconst counter = new Counter(3);\ncounter.add(2);\nconst result = counter.value;', 5, [3, 2], 'Parameter property создаёт value, метод прибавляет к нему 2.'),
    question('Можно ли передать plain в greet без создания экземпляра класса?', 'class Person { name = "Анна"; }\nfunction greet(person: Person) { return person.name; }\nconst plain = { name: "Ира" };', 'Да, plain структурно соответствует Person', ['Нет, допустим только new Person()', 'Нет, у plain должен быть метод greet'], 'TypeScript сравнивает структуру публичных свойств; обязательное name присутствует.'),
  ],
  'typescript-modules': [
    question('Нужен ли импорт User в исполняемом JavaScript после компиляции?', '// user.ts\nexport interface User { name: string }\n\n// main.ts\nimport type { User } from "./user.js";\nconst user: User = { name: "Ира" };', 'Нет, import type и интерфейс удаляются при компиляции', ['Да, interface загружается как JSON', 'Да, import type вызывает конструктор User'], 'Это связи только для проверки типов; исполняемых значений User нет.'),
    question('Что сообщает ошибка при таком присваивании с включённым strictNullChecks?', 'const name: string = null;', 'null не входит в тип string', ['Строки запрещены при strictNullChecks', 'null автоматически преобразуется в "null"'], 'С включённым strictNullChecks null должен быть явно включён в union, если он допустим.'),
  ],
};

// Framework snippets explicitly name the request, route and relevant setup.
const express = (code) => 'const express = require("express");\nconst app = express();\n' + code;
export const appliedHttpFixtures = [];
const http = (prompt, code, correct, wrong, explanation) => {
  const source = express(code);
  const match = prompt.match(/\b(GET|POST|DELETE) (\/\S*)/);
  if (match && (/^\d{3}$/.test(correct) || /^[{[]/.test(correct) || correct === 'AB')) {
    const body = prompt.match(/JSON (\{[^}]*\})/);
    appliedHttpFixtures.push({ code: source, method: match[1].toLowerCase(), path: match[2].replace(/[?.,]$/, ''), body: body ? JSON.parse(body[1]) : undefined, correct });
  }
  return question(prompt, source, correct, wrong, explanation);
};
Object.assign(rows, {
  'express-http': [
    http('Какое JSON-тело получит GET /health?', 'app.get("/health", (req, res) => res.json({ ok: true }));', '{"ok":true}', ['{}', 'null'], 'Обработчик передаёт res.json объект с полем ok: true.'),
    http('Какой статус получит GET /health?', 'app.get("/health", (req, res) => res.status(201).json({ ok: true }));', '201', ['200', '404'], 'status(201) явно устанавливает код ответа перед json.'),
  ],
  'express-routing': [
    http('Какое JSON-тело получит GET /users/42?', 'app.get("/users/:id", (req, res) => res.json({ id: req.params.id }));', '{"id":"42"}', ['{"id":42}', '{}'], 'Параметр пути id читается из req.params как строка.'),
    http('Какой обработчик ответит на POST /items?', 'app.get("/items", (req, res) => res.send("список"));\napp.post("/items", (req, res) => res.send("создано"));', 'POST-обработчик, тело «создано»', ['GET-обработчик, тело «список»', 'Оба обработчика по очереди'], 'Маршрут выбирается и по пути, и по HTTP-методу.'),
  ],
  'express-middleware': [
    http('Какое тело получит GET /? Других middleware нет.', 'app.use((req, res, next) => { req.trace = "A"; next(); });\napp.use((req, res, next) => { req.trace += "B"; next(); });\napp.get("/", (req, res) => res.send(req.trace));', 'AB', ['BA', 'A'], 'Middleware выполняются в порядке регистрации; next передаёт управление дальше.'),
    http('Какой статус получит GET /private?', 'app.use((req, res) => res.status(401).json({ error: "Войдите" }));\napp.get("/private", (req, res) => res.json({ secret: true }));', '401', ['200', '404'], 'Первое middleware завершает ответ и не вызывает next; маршрут не выполнится.'),
  ],
  'express-router': [
    http('По какому пути доступен обработчик списка?', 'const router = express.Router();\nrouter.get("/items", (req, res) => res.json([]));\napp.use("/api", router);', 'GET /api/items', ['GET /items/api', 'GET /items'], 'Путь подключения /api складывается с путём маршрута /items.'),
    http('Какое JSON-тело получит GET /api/books/js?', 'const router = express.Router();\nrouter.get("/books/:slug", (req, res) => res.json({ slug: req.params.slug }));\napp.use("/api", router);', '{"slug":"js"}', ['{"slug":"books"}', '{}'], 'Параметр slug соответствует сегменту js.'),
  ],
  'express-query': [
    http('Какое JSON-тело получит GET /items?page=3?', 'app.get("/items", (req, res) => {\n  const page = Number(req.query.page ?? 1);\n  res.json({ page });\n});', '{"page":3}', ['{"page":"3"}', '{"page":1}'], 'Query приходит строкой, а Number явно преобразует "3" в число.'),
    http('Какое JSON-тело получит GET /items без query-параметров?', 'app.get("/items", (req, res) => {\n  const limit = Number(req.query.limit ?? 10);\n  res.json({ limit });\n});', '{"limit":10}', ['{"limit":0}', '{}'], 'Отсутствующий limit заменяется значением 10.'),
  ],
  'express-validation': [
    http('Какой статус получит POST /items с JSON {"title":""} и Content-Type: application/json?', 'app.use(express.json());\napp.post("/items", (req, res) => {\n  if (typeof req.body.title !== "string" || !req.body.title.trim()) {\n    return res.status(400).json({ error: "Укажите название" });\n  }\n  res.status(201).json({ title: req.body.title.trim() });\n});', '400', ['201', '500'], 'Пустая строка не проходит проверку; обработчик возвращает 400.'),
    http('Какое JSON-тело получит POST /items с JSON {"title":" JS "} и Content-Type: application/json?', 'app.use(express.json());\napp.post("/items", (req, res) => {\n  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";\n  if (!title) return res.status(400).json({ error: "Укажите название" });\n  res.status(201).json({ title });\n});', '{"title":"JS"}', ['{"title":" JS "}', '{"error":"Укажите название"}'], 'trim удаляет внешние пробелы; непустое значение проходит проверку.'),
  ],
  'express-crud': [
    http('Какой статус получит DELETE /items/1 при показанном начальном состоянии?', 'const items = new Map([["1", { title: "JS" }]]);\napp.delete("/items/:id", (req, res) => {\n  if (!items.delete(req.params.id)) return res.sendStatus(404);\n  res.sendStatus(204);\n});', '204', ['404', '201'], 'Ключ "1" есть в Map, delete возвращает true, отправляется 204.'),
    http('Какой статус получит GET /items/99?', 'const items = new Map();\napp.get("/items/:id", (req, res) => {\n  const item = items.get(req.params.id);\n  if (!item) return res.status(404).json({ error: "Не найдено" });\n  res.json(item);\n});', '404', ['200', '204'], 'Map пуст, поэтому обработчик завершает ответ с 404.'),
  ],
  'express-errors': [
    http('Какой статус получит GET /fail?', 'app.get("/fail", (req, res, next) => next(new Error("Сбой")));\napp.use((err, req, res, next) => res.status(500).json({ error: "Ошибка сервера" }));', '500', ['200', '404'], 'next с ошибкой передаёт управление четырёхаргументному error middleware.'),
    question('Какую сигнатуру нужно использовать для Express error middleware?', 'const express = require("express");\nconst app = express();\n// Здесь нужно зарегистрировать обработчик ошибок через app.use.', '(err, req, res, next)', ['(req, res, next)', '(req, error)'], 'Express узнаёт error middleware по четырём аргументам в указанном порядке.'),
  ],
  'express-async': [
    http('Какой статус получит GET /fail в Express 5?', 'app.get("/fail", async (req, res) => { throw new Error("Сбой"); });\napp.use((err, req, res, next) => res.status(503).json({ error: "Недоступно" }));', '503', ['200', '404'], 'Express 5 передаёт отклонение Promise из async-обработчика в error middleware.'),
    http('Какое JSON-тело получит GET /value в Express 5?', 'app.get("/value", async (req, res) => {\n  const value = await Promise.resolve(7);\n  res.json({ value });\n});', '{"value":7}', ['{"value":{}}', '{"value":"Promise"}'], 'await получает число 7 до формирования ответа.'),
  ],
  'express-architecture': [
    value('const repository = { find: id => ({ id, title: "JS" }) };\nfunction createService(repo) {\n  return { title: id => repo.find(id).title };\n}\nconst service = createService(repository);\nconst result = service.title("1");', 'JS', ['1', null], 'Сервис получает репозиторий через параметр и возвращает title найденной записи.'),
    question('Какой объект безопасно передать res.json как публичное представление этого пользователя?', 'const user = { id: "1", name: "Ира", passwordHash: "private-hash" };', '{ id: user.id, name: user.name }', ['user', '{ ...user }'], 'Явный выбор публичных полей исключает passwordHash; spread скопировал бы его.'),
  ],
  'express-security': [
    value('const userId = "u1";\nconst note = { id: "n1", ownerId: "u2" };\nconst result = note.ownerId === userId;', false, [true, 'u1'], 'Идентификаторы владельца u2 и текущего пользователя u1 различаются.'),
    question('Что ограничивает httpOnly в этой настройке cookie? res — объект ответа Express, token — созданный сервером токен сессии.', 'res.cookie("session", token, {\n  httpOnly: true, secure: true, sameSite: "lax"\n});', 'Чтение cookie JavaScript-кодом страницы', ['Отправку cookie браузером на сервер', 'Все запросы POST без дополнительной защиты'], 'HttpOnly скрывает cookie от document.cookie, но браузер продолжает отправлять её серверу.'),
  ],
  'express-testing': [
    question('Пройдёт ли этот интеграционный тест в Node.js?', 'const express = require("express");\nconst request = require("supertest");\nconst app = express();\napp.get("/health", (req, res) => res.json({ ok: true }));\nawait request(app).get("/health").expect(200).expect({ ok: true });', 'Да, статус и тело соответствуют ожиданиям', ['Нет, маршрут возвращает 404', 'Нет, ok должен быть строкой'], 'GET /health возвращает 200 и JSON с boolean true.'),
    question('Какое ожидаемое тело нужно указать вместо комментария для успешной проверки?', 'const express = require("express");\nconst request = require("supertest");\nconst app = express();\napp.get("/count", (req, res) => res.json({ count: 2 }));\nawait request(app).get("/count").expect(200).expect(/* тело ответа */);', '{ count: 2 }', ['{ count: "2" }', '{}'], 'JSON содержит числовое поле count: 2; проверка тела различает строку и число.'),
  ],
});

const nestQuestion = (prompt, code, correct, wrong, explanation) => question(prompt, code, correct, wrong, explanation);
Object.assign(rows, {
  'nest-bootstrap': [
    nestQuestion('Какой класс является корневым модулем в показанном запуске Nest?', 'import { Module } from "@nestjs/common";\nimport { NestFactory } from "@nestjs/core";\n@Module({})\nclass AppModule {}\nconst app = await NestFactory.create(AppModule);\nawait app.listen(3000);', 'AppModule', ['NestFactory', 'Module'], 'Первый аргумент create — корневой модуль AppModule.'),
    nestQuestion('На каком порту приложение принимает HTTP-запросы?', 'import { Module } from "@nestjs/common";\nimport { NestFactory } from "@nestjs/core";\n@Module({})\nclass AppModule {}\nconst app = await NestFactory.create(AppModule);\nawait app.listen(4000);', '4000', ['3000', '80'], 'В listen явно передан порт 4000.'),
  ],
  'nest-modules': [
    nestQuestion('Какая запись открывает CatalogService для модулей, импортирующих CatalogModule?', 'import { Injectable, Module } from "@nestjs/common";\n@Injectable()\nclass CatalogService {}\n@Module({ providers: [CatalogService], exports: [CatalogService] })\nclass CatalogModule {}', 'exports: [CatalogService]', ['providers: [CatalogService] без exports', 'class CatalogModule {} без декоратора'], 'providers регистрирует зависимость локально, exports открывает её потребителям модуля.'),
    nestQuestion('Какой провайдер доступен внутри AppModule благодаря импорту?', 'import { Injectable, Module } from "@nestjs/common";\n@Injectable()\nclass Store {}\n@Module({ providers: [Store], exports: [Store] })\nclass StoreModule {}\n@Module({ imports: [StoreModule] })\nclass AppModule {}', 'Store', ['Любой необъявленный класс', 'Ни один, exports не учитывается'], 'Импорт StoreModule даёт доступ к его экспортированному Store.'),
  ],
  'nest-injection': [
    nestQuestion('Какое значение Nest внедрит в параметр label? Сервис зарегистрирован в показанном модуле.', 'import { Inject, Injectable, Module } from "@nestjs/common";\n@Injectable()\nclass LabelService {\n  constructor(@Inject("LABEL") public label: string) {}\n}\n@Module({ providers: [LabelService, { provide: "LABEL", useValue: "JS" }] })\nclass AppModule {}', '"JS"', ['"LABEL"', 'undefined'], 'Inject использует токен LABEL; useValue задаёт его значение JS.'),
    nestQuestion('Какое значение создаст фабрика провайдера LIMIT?', 'const provider = {\n  provide: "LIMIT",\n  useFactory: () => 5 * 2\n};', '10', ['5', '"LIMIT"'], 'useFactory вызывается контейнером и возвращает вычисленное значение 10.'),
  ],
  'nest-controllers': [
    nestQuestion('Какой маршрут обслуживает метод list? Контроллер зарегистрирован в приложении без глобального префикса.', 'import { Controller, Get } from "@nestjs/common";\n@Controller("books")\nclass BooksController {\n  @Get("recent")\n  list() { return []; }\n}', 'GET /books/recent', ['POST /books/recent', 'GET /recent/books'], 'Путь контроллера books складывается с путём метода recent; Get задаёт HTTP-метод.'),
    nestQuestion('Какое JSON-тело вернёт GET /health? Контроллер зарегистрирован, глобального префикса нет.', 'import { Controller, Get } from "@nestjs/common";\n@Controller()\nclass HealthController {\n  @Get("health")\n  health() { return { ok: true }; }\n}', '{"ok":true}', ['{}', '"ok"'], 'Nest сериализует объект, возвращённый обработчиком, в JSON.'),
  ],
  'nest-validation': [
    nestQuestion('Пройдёт ли значение title из тела {"title":42} валидацию этого DTO? ValidationPipe включён, преобразование чисел в строки отключено.', 'import { IsString } from "class-validator";\nclass CreateBookDto {\n  @IsString()\n  title!: string;\n}', 'Нет, title должен быть строкой', ['Да, TypeScript преобразует 42 в строку', 'Да, IsString проверяет имя поля'], 'IsString проверяет фактическое значение во время запроса, а не аннотацию TypeScript.'),
    nestQuestion('Что произойдёт с телом {"name":"Ира","admin":true} при такой конфигурации ValidationPipe? DTO содержит только показанное поле.', 'import { ValidationPipe } from "@nestjs/common";\nimport { IsString } from "class-validator";\nclass UserDto { @IsString() name!: string; }\nconst pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true });', 'Запрос отклоняется из-за неизвестного admin', ['admin сохраняется в DTO', 'admin становится false'], 'forbidNonWhitelisted вместе с whitelist отклоняет свойства без правил DTO.'),
  ],
  'nest-pipes': [
    nestQuestion('Какое значение получит id при GET /items/12? Контроллер зарегистрирован без глобального префикса.', 'import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";\n@Controller("items")\nclass ItemsController {\n  @Get(":id")\n  read(@Param("id", ParseIntPipe) id: number) { return { id }; }\n}', 'Число 12', ['Строку "12"', 'undefined'], 'ParseIntPipe преобразует корректную целочисленную строку в number до вызова метода.'),
    nestQuestion('Какой статус вернёт GET /items/abc при стандартной настройке ParseIntPipe?', 'import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";\n@Controller("items")\nclass ItemsController {\n  @Get(":id")\n  read(@Param("id", ParseIntPipe) id: number) { return { id }; }\n}', '400', ['200', '404'], 'abc не является целочисленной строкой, pipe отклоняет аргумент до обработчика.'),
  ],
  'nest-guards': [
    nestQuestion('Будет ли вызван обработчик, защищённый этим guard?', 'import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";\n@Injectable()\nclass DenyGuard implements CanActivate {\n  canActivate(context: ExecutionContext) { return false; }\n}', 'Нет, guard запрещает доступ', ['Да, false означает пропустить проверку', 'Да, guard выполняется после ответа'], 'Ложное решение guard останавливает цепочку перед вызовом защищённого метода.'),
    nestQuestion('Кто получит доступ по правилу этого guard: пользователь с ролью admin или student? Guard подключён к маршруту, user уже установлен middleware.', 'import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";\n@Injectable()\nclass AdminGuard implements CanActivate {\n  canActivate(context: ExecutionContext) {\n    const request = context.switchToHttp().getRequest();\n    return request.user?.role === "admin";\n  }\n}', 'Только пользователь с ролью admin', ['Оба пользователя', 'Только пользователь с ролью student'], 'Проверяется точное равенство роли строке admin.'),
  ],
  'nest-decorators': [
    nestQuestion('Какой ключ и значение метаданных записывает Roles("admin")?', 'import { SetMetadata } from "@nestjs/common";\nconst Roles = (...roles: string[]) => SetMetadata("roles", roles);', 'Ключ "roles", значение ["admin"]', ['Ключ "admin", значение true', 'Ключ "roles", значение "student"'], 'Функция собирает аргументы в массив и передаёт их SetMetadata под ключом roles.'),
    nestQuestion('Будет ли один SetMetadata автоматически запрещать запрос неадминистратору без guard или другого кода проверки?', 'import { Controller, Get, SetMetadata } from "@nestjs/common";\n@Controller("items")\nclass ItemsController {\n  @Get()\n  @SetMetadata("roles", ["admin"])\n  list() { return []; }\n}', 'Нет, метаданные нужно прочитать и применить в проверке доступа', ['Да, SetMetadata самостоятельно проверит роль', 'Да, SetMetadata проверит пароль'], 'Декоратор записывает данные, но сам не выполняет авторизацию.'),
  ],
  'nest-interceptors': [
    nestQuestion('Какое значение получит подписчик result$?', 'import { of, map } from "rxjs";\nconst result$ = of({ id: 1 }).pipe(map(data => ({ data })));', '{ data: { id: 1 } }', ['{ id: 1 }', '[{ id: 1 }]'], 'map оборачивает каждый элемент потока в объект с полем data.'),
    nestQuestion('Что должен вернуть interceptor вместо комментария, чтобы Nest управлял потоком ответа?', 'import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";\nimport { map } from "rxjs";\nclass WrapInterceptor implements NestInterceptor {\n  intercept(context: ExecutionContext, next: CallHandler) {\n    // Оберните результат обработчика в { data }.\n  }\n}', 'return next.handle().pipe(map(data => ({ data })));', ['return next.handle().subscribe();', 'return { data: next };'], 'Нужно вернуть преобразованный Observable, сохранив управляемую Nest цепочку.'),
  ],
  'nest-filters': [
    nestQuestion('Какой HTTP-статус содержит созданное исключение?', 'import { HttpException } from "@nestjs/common";\nconst error = new HttpException("Не найдено", 404);\nconst status = error.getStatus();', '404', ['200', '500'], 'Конструктор HttpException получил статус 404, getStatus возвращает его.'),
    nestQuestion('Какие исключения выбирает этот декоратор фильтра?', 'import { Catch, HttpException, ExceptionFilter, ArgumentsHost } from "@nestjs/common";\n@Catch(HttpException)\nclass HttpFilter implements ExceptionFilter {\n  catch(error: HttpException, host: ArgumentsHost) {\n    host.switchToHttp().getResponse().status(error.getStatus()).json({ error: error.message });\n  }\n}', 'HttpException и его подклассы', ['Только ошибки браузерного DOM', 'Все события HTTP без исключений'], 'Аргумент Catch ограничивает типы исключений, которые обрабатывает фильтр.'),
  ],
  'nest-configuration': [
    value('const env = { PORT: "4000" };\nconst result = Number(env.PORT ?? "3000");', 4000, ['4000', 3000], 'Внешнее значение — строка; Number явно преобразует её в число.'),
    value('const env: { PORT?: string } = {};\nconst result = Number(env.PORT ?? "3000");', 3000, [0, null], 'Порт отсутствует; ?? подставляет строку 3000, затем Number преобразует её.'),
  ],
  'nest-persistence': [
    value('class MemoryRepository {\n  private items = new Map<string, string>();\n  save(id: string, title: string) { this.items.set(id, title); }\n  find(id: string) { return this.items.get(id); }\n}\nconst repo = new MemoryRepository();\nrepo.save("1", "JS");\nconst result = repo.find("1");', 'JS', ['1', null], 'Оба метода используют одну Map экземпляра; find возвращает сохранённое название.'),
    nestQuestion('Что должно произойти с первой записью, если вторая операция этой транзакции завершилась ошибкой? Используется БД с атомарными транзакциями.', '// db — клиент БД, tx — клиент текущей транзакции.\nawait db.$transaction(async tx => {\n  await tx.order.create({ data: { id: "o1" } });\n  await tx.payment.create({ data: { orderId: "o1" } });\n});', 'Первая запись откатывается вместе со всей транзакцией', ['Первая запись обязательно сохраняется', 'Ошибка превращает первую запись в JSON'], 'Атомарность означает либо успешное применение всех изменений, либо откат набора.'),
  ],
  'nest-testing': [
    nestQuestion('Какое значение будет у moduleRef.get("LABEL")?', 'import { Test } from "@nestjs/testing";\nconst moduleRef = await Test.createTestingModule({\n  providers: [{ provide: "LABEL", useValue: "real" }]\n}).overrideProvider("LABEL").useValue("fake").compile();', '"fake"', ['"real"', 'undefined'], 'overrideProvider заменяет провайдер до компиляции тестового модуля.'),
    nestQuestion('Как завершить показанный тестовый модуль и освободить его ресурсы?', 'import { Test } from "@nestjs/testing";\nconst moduleRef = await Test.createTestingModule({ providers: [] }).compile();', 'await moduleRef.close();', ['moduleRef = null;', 'console.log(moduleRef);'], 'close запускает завершение контекста и lifecycle его провайдеров.'),
  ],
  'nest-lifecycle': [
    nestQuestion('Когда Nest вызовет onModuleDestroy у этого провайдера? Он зарегистрирован в приложении.', 'import { Injectable, OnModuleDestroy } from "@nestjs/common";\n@Injectable()\nclass Store implements OnModuleDestroy {\n  onModuleDestroy() { console.log("закрыто"); }\n}', 'При корректном завершении контекста, например await app.close()', ['После каждого GET-запроса', 'После каждого вызова конструктора'], 'Lifecycle завершения запускается при закрытии приложения, а не при завершении отдельного запроса.'),
    nestQuestion('В каком порядке middleware, guard, pipe и handler выполнятся на входе запроса, если все проверки успешны?', '// В приложении подключены middleware, guard и pipe.\n// Interceptors и дополнительные обработчики отсутствуют.\n// Все стадии передают управление дальше.', 'middleware → guard → pipe → handler', ['pipe → middleware → handler → guard', 'handler → guard → pipe → middleware'], 'Middleware обрабатывает запрос первым; guard решает доступ; pipe готовит аргументы перед handler.'),
  ],
});

export function appliedQuestions(id, section) {
  if (!rows[id] || rows[id].length !== 2) throw new Error(`Missing standalone questions: ${id}`);
  return rows[id].map(q => ({ ...q, section }));
}
