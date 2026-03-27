import { Client } from 'pg';

const DATABASE_URL = 'postgresql://postgres:postgres@localhost:54322/del4db';
const VECTOR_API_URL = 'http://localhost:8000/api/v1';

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

try {
  const { rows } = await client.query(`
    SELECT id, user_id, my_profile, desired_profile, undesired_profile
    FROM profiles
    ORDER BY user_id ASC
  `);

  for (const row of rows) {
    const parseText = (value) => {
      try {
        const parsed = JSON.parse(value);
        return typeof parsed === 'string' ? parsed : (parsed?.text ?? value);
      } catch {
        return value;
      }
    };

    const texts = [
      parseText(row.my_profile),
      parseText(row.desired_profile),
      parseText(row.undesired_profile),
    ];

    const response = await fetch(`${VECTOR_API_URL}/vectorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
      throw new Error(`vectorize failed for ${row.user_id}: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const [myVector, desiredVector, undesiredVector] = data.vectors;

    await client.query(
      `
        INSERT INTO profile_vectors (
          id,
          profile_id,
          my_profile_vector,
          desired_profile_vector,
          undesired_profile_vector,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3::vector, $4::vector, $5::vector, NOW(), NOW())
        ON CONFLICT (profile_id)
        DO UPDATE SET
          my_profile_vector = EXCLUDED.my_profile_vector,
          desired_profile_vector = EXCLUDED.desired_profile_vector,
          undesired_profile_vector = EXCLUDED.undesired_profile_vector,
          updated_at = NOW()
      `,
      [
        `vec-${row.user_id}`,
        row.id,
        JSON.stringify(myVector),
        JSON.stringify(desiredVector),
        JSON.stringify(undesiredVector),
      ],
    );

    console.log(`vectorized ${row.user_id}`);
  }

  const { rows: countRows } = await client.query('SELECT COUNT(*)::int AS count FROM profile_vectors');
  console.log(`profile_vectors count=${countRows[0].count}`);
} finally {
  await client.end();
}
