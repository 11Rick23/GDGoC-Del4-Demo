/**
 * テストデータ投入スクリプト
 * - ユーザー10件
 * - 各ユーザーのプロフィール
 *
 * 使い方: npm run db:seed
 * ※ ベクトル化は seed 後に手動で POST /vectorize-full を呼ぶか、
 *    vector バックエンドを起動してから curl で叩いてください
 */

import "dotenv/config";
import { Client } from "pg";
import { nanoid } from "nanoid";

const DATABASE_URL =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@localhost:54322/del4db";

const USERS = [
	{
		id: nanoid(),
		name: "Alice",
		email: "alice@example.com",
		myProfile: {
			age: 25,
			gender: "female",
			hobbies: ["読書", "ヨガ", "料理"],
			occupation: "エンジニア",
			personality: "内向的・穏やか",
		},
		desiredProfile: {
			age_range: "25-35",
			hobbies: ["読書", "アウトドア"],
			personality: "穏やか・誠実",
		},
		undesiredProfile: {
			hobbies: ["ギャンブル"],
			personality: "短気・自己中心的",
		},
	},
	{
		id: nanoid(),
		name: "Bob",
		email: "bob@example.com",
		myProfile: {
			age: 28,
			gender: "male",
			hobbies: ["ハイキング", "読書", "コーヒー"],
			occupation: "デザイナー",
			personality: "外向的・社交的",
		},
		desiredProfile: {
			age_range: "23-33",
			hobbies: ["アウトドア", "料理"],
			personality: "明るい・誠実",
		},
		undesiredProfile: {
			hobbies: ["ゲーム依存"],
			personality: "嘘つき・無責任",
		},
	},
	{
		id: nanoid(),
		name: "Carol",
		email: "carol@example.com",
		myProfile: {
			age: 27,
			gender: "female",
			hobbies: ["旅行", "写真", "カフェ巡り"],
			occupation: "マーケター",
			personality: "外向的・好奇心旺盛",
		},
		desiredProfile: {
			age_range: "27-37",
			hobbies: ["旅行", "グルメ"],
			personality: "積極的・冒険好き",
		},
		undesiredProfile: {
			hobbies: ["インドア専門"],
			personality: "消極的・ネガティブ",
		},
	},
	{
		id: nanoid(),
		name: "Dave",
		email: "dave@example.com",
		myProfile: {
			age: 31,
			gender: "male",
			hobbies: ["筋トレ", "料理", "映画"],
			occupation: "会社員",
			personality: "真面目・几帳面",
		},
		desiredProfile: {
			age_range: "25-35",
			hobbies: ["料理", "スポーツ"],
			personality: "健康的・前向き",
		},
		undesiredProfile: {
			hobbies: ["夜遊び"],
			personality: "だらしない・無計画",
		},
	},
	{
		id: nanoid(),
		name: "Eve",
		email: "eve@example.com",
		myProfile: {
			age: 24,
			gender: "female",
			hobbies: ["音楽", "絵画", "散歩"],
			occupation: "デザイナー",
			personality: "クリエイティブ・内向的",
		},
		desiredProfile: {
			age_range: "24-34",
			hobbies: ["アート", "音楽"],
			personality: "感受性豊か・優しい",
		},
		undesiredProfile: {
			hobbies: ["スポーツ観戦のみ"],
			personality: "無神経・雑",
		},
	},
	{
		id: nanoid(),
		name: "Frank",
		email: "frank@example.com",
		myProfile: {
			age: 33,
			gender: "male",
			hobbies: ["登山", "キャンプ", "釣り"],
			occupation: "エンジニア",
			personality: "自立的・冒険好き",
		},
		desiredProfile: {
			age_range: "26-36",
			hobbies: ["アウトドア", "自然"],
			personality: "行動力がある・健康的",
		},
		undesiredProfile: {
			hobbies: ["ショッピング依存"],
			personality: "依存的・浪費家",
		},
	},
	{
		id: nanoid(),
		name: "Grace",
		email: "grace@example.com",
		myProfile: {
			age: 29,
			gender: "female",
			hobbies: ["読書", "料理", "ガーデニング"],
			occupation: "教師",
			personality: "温かい・家庭的",
		},
		desiredProfile: {
			age_range: "28-40",
			hobbies: ["読書", "料理"],
			personality: "落ち着いた・家庭思い",
		},
		undesiredProfile: {
			hobbies: ["パーティー三昧"],
			personality: "軽薄・不誠実",
		},
	},
	{
		id: nanoid(),
		name: "Hiro",
		email: "hiro@example.com",
		myProfile: {
			age: 26,
			gender: "male",
			hobbies: ["ゲーム", "プログラミング", "アニメ"],
			occupation: "ITエンジニア",
			personality: "論理的・オタク気質",
		},
		desiredProfile: {
			age_range: "22-32",
			hobbies: ["ゲーム", "テクノロジー"],
			personality: "頭が良い・理解力がある",
		},
		undesiredProfile: {
			hobbies: ["テクノロジー嫌い"],
			personality: "感情的・非論理的",
		},
	},
	{
		id: nanoid(),
		name: "Iris",
		email: "iris@example.com",
		myProfile: {
			age: 30,
			gender: "female",
			hobbies: ["ダンス", "ジム", "グルメ"],
			occupation: "営業",
			personality: "エネルギッシュ・社交的",
		},
		desiredProfile: {
			age_range: "28-38",
			hobbies: ["スポーツ", "食べること"],
			personality: "活発・前向き",
		},
		undesiredProfile: {
			hobbies: ["引きこもり"],
			personality: "暗い・無気力",
		},
	},
	{
		id: nanoid(),
		name: "Jack",
		email: "jack@example.com",
		myProfile: {
			age: 35,
			gender: "male",
			hobbies: ["投資", "読書", "ゴルフ"],
			occupation: "コンサルタント",
			personality: "野心的・戦略的",
		},
		desiredProfile: {
			age_range: "27-37",
			hobbies: ["ビジネス", "自己啓発"],
			personality: "向上心がある・知的",
		},
		undesiredProfile: {
			hobbies: ["無計画な浪費"],
			personality: "向上心なし・怠惰",
		},
	},
];

async function main() {
	const client = new Client({ connectionString: DATABASE_URL });
	await client.connect();

	for (const user of USERS) {
		// ユーザー挿入
		await client.query(
			`INSERT INTO users (id, name, email, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET name = $2, updated_at = NOW()`,
			[user.id, user.name, user.email],
		);

		// ON CONFLICT で更新された場合は既存のIDを取得
		const { rows } = await client.query(
			"SELECT id FROM users WHERE email = $1",
			[user.email],
		);
		const userId = rows[0].id;

		const profileId = nanoid();
		await client.query(
			`INSERT INTO profiles (id, user_id, my_profile, desired_profile, undesired_profile, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         my_profile = $3,
         desired_profile = $4,
         undesired_profile = $5,
         updated_at = NOW()`,
			[
				profileId,
				userId,
				JSON.stringify(user.myProfile),
				JSON.stringify(user.desiredProfile),
				JSON.stringify(user.undesiredProfile),
			],
		);

		console.log(`✅ Seeded: ${user.name} (userId=${userId})`);
	}

	await client.end();

	console.log("");
	console.log("✅ Seed complete.");
	console.log(
		"次のステップ: vector バックエンドを起動して各ユーザーのベクトルを生成してください",
	);
	console.log(
		"  curl -X POST http://localhost:8000/api/v1/vectorize-full -H 'Content-Type: application/json' -d '{\"userId\": \"<userId>\"}'",
	);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
