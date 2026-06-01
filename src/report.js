const units = ["B", "KB", "MB", "GB", "TB"];

export function createDuplicateReport(index) {
  const assetsById = new Map((index.assets ?? []).map((asset) => [asset.id, asset]));
  const duplicates = index.duplicates ?? [];
  const lines = [
    "# Duplicate Review Report",
    "",
    `Generated: ${index.generatedAt ?? "Unknown"}`,
    `Total assets: ${index.summary?.totalAssets ?? 0}`,
    `Duplicate groups: ${index.summary?.duplicateGroups ?? duplicates.length}`,
    `Reclaimable: ${formatBytes(index.summary?.reclaimableBytes ?? 0)}`,
    ""
  ];

  if (!duplicates.length) {
    lines.push("No duplicate groups were found.", "");
    return lines.join("\n");
  }

  duplicates.forEach((group, indexInList) => {
    lines.push(`## Group ${indexInList + 1}`);
    lines.push("");
    lines.push(`- Files: ${group.count}`);
    lines.push(`- Reclaimable: ${formatBytes(group.reclaimableBytes ?? 0)}`);
    lines.push(`- Hash: \`${group.hash}\``);
    lines.push("");

    for (const assetId of group.assetIds ?? []) {
      const asset = assetsById.get(assetId);
      if (!asset) {
        continue;
      }
      lines.push(`- \`${asset.relativePath}\` (${asset.rootName}, ${formatBytes(asset.sizeBytes)})`);
    }

    lines.push("");
  });

  return lines.join("\n");
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted = value >= 10 || unitIndex === 0 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, "");
  return `${formatted} ${units[unitIndex]}`;
}
