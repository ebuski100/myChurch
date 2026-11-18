const fs = require('fs');
const p = 'src/app/admin/departments/actions.ts';
let s = fs.readFileSync(p, 'utf8');

const old1 = '  const publicationStatus = statusFrom(form);';
const neu1 = '  const publicationIntent = form.get("publicationIntent") as string | null;\n' +
  '  let publicationStatus = statusFrom(form);\n' +
  '  let scheduledAt: string | null = null;\n' +
  '  if (publicationIntent === "publish") {\n' +
  '    publicationStatus = "published";\n' +
  '  } else if (publicationIntent === "draft") {\n' +
  '    publicationStatus = "draft";\n' +
  '  } else if (publicationIntent === "schedule") {\n' +
  '    publicationStatus = "draft";\n' +
  '    const parsed = parseLagosScheduleDate(form.get("scheduledAt"));\n' +
  '    if (!parsed.ok) redirect("/admin/departments?error=invalid_schedule");\n' +
  '    scheduledAt = parsed.iso;\n' +
  '  }';
if (s.indexOf(old1) === -1) { console.log('old1 not found'); process.exit(1); }
s = s.replace(old1, neu1);

const old2 = '      publication_status: publicationStatus,\n      is_public: publicationStatus === "published" && isPublic,\n    })';
const neu2 = '      publication_status: publicationStatus,\n' +
  '      is_public: publicationIntent ? publicationIntent === "publish" : publicationStatus === "published" && isPublic,\n' +
  '      scheduled_at: publicationIntent ? (publicationIntent === "schedule" ? scheduledAt : null) : undefined,\n' +
  '    })';
if (s.indexOf(old2) === -1) { console.log('old2 not found'); process.exit(1); }
s = s.replace(old2, neu2);

fs.writeFileSync(p, s);
console.log('done');
