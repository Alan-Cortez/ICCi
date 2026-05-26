export async function rows(db, sql, args = []) {
  const safeArgs = args.map(a => a === undefined ? null : a);
  const r = await db.execute({ sql, args: safeArgs });
  return r.rows;
}

export async function row(db, sql, args = []) {
  const safeArgs = args.map(a => a === undefined ? null : a);
  const r = await db.execute({ sql, args: safeArgs });
  return r.rows[0] ?? null;
}

export async function insert(db, sql, args = []) {
  const safeArgs = args.map(a => a === undefined ? null : a);
  const r = await db.execute({ sql, args: safeArgs });
  return { success: true, id: Number(r.lastInsertRowid) };
}

export async function run(db, sql, args = []) {
  const safeArgs = args.map(a => a === undefined ? null : a);
  await db.execute({ sql, args: safeArgs });
  return { success: true };
}
