import { policyData } from "@/shared/constants/policy";

export function PolicyContent() {
	return (
		<div>
			{policyData.map((item, index) => {
				if (item.type === "title") {
					return (
						<h2 key={index} className="mb-4 text-xl font-bold">
							{item.text}
						</h2>
					);
				}

				if (item.type === "section_title") {
					return (
						<h2 key={index} className="mb-4 mt-12 text-xl font-bold">
							{item.text}
						</h2>
					);
				}

				if (item.type === "article_title") {
					return (
						<h3 key={index} className="mb-2 mt-6 text-base font-semibold sm:text-[1.05rem]">
							{item.text}
						</h3>
					);
				}

				if (item.type === "list_item") {
					return (
						<ul key={index} className="mb-1 ml-5 list-disc">
							<li>{item.text}</li>
						</ul>
					);
				}

				return (
					<p key={index} className="mb-2 text-sm leading-7">
						{item.text}
					</p>
				);
			})}
		</div>
	);
}
