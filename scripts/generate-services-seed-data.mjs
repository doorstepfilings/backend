import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSourcePath =
  "D:/wamp64/www/doorstepfilings/database/seeders/ServicesSeeder.php";
const sourcePath = process.argv[2] ?? defaultSourcePath;
const outputPath = path.resolve(
  __dirname,
  "../src/database/seed-data/services.seed-data.ts",
);

const phpScript = `
$file = $argv[1];
$content = file_get_contents($file);
$start = strpos($content, '$servicesData = [');
$end = strpos($content, '$this->seedCategories(', $start);
if ($start === false || $end === false) {
    fwrite(STDERR, "Unable to locate services data block\\n");
    exit(1);
}
$body = substr($content, $start, $end - $start);
$script = 'return (function () { ' . $body . ' return $servicesData; })();';
$data = eval($script);
if (!is_array($data)) {
    fwrite(STDERR, "Extractor did not return an array\\n");
    exit(1);
}
echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
`;

const json = execFileSync("php", ["-r", phpScript, sourcePath], {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});

const data = JSON.parse(json);
const contents = `/* Auto-generated from ${sourcePath}. Run \`npm run seed:extract-legacy-services\` to refresh. */

const servicesSeedData = ${JSON.stringify(data, null, 4)};

export default servicesSeedData;
`;

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, contents, "utf8");

const serviceCount = data.reduce(
  (total, category) => total + (Array.isArray(category.services) ? category.services.length : 0),
  0,
);

console.log(
  `Wrote ${outputPath} with ${data.length} categories and ${serviceCount} services.`,
);
