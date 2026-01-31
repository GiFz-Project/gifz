export async function getResources(timestamp = null, limit = 100) {
    const where = [];
    const params = [];

    if (timestamp) {
        where.push("created >= ?");
        params.push(timestamp);
    }

    return await db.queryDatabase(
        `
        SELECT *
        FROM resources
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY created DESC
        LIMIT ${limit}
        `,
        params
    );
}

