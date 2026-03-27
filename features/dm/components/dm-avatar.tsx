import Image from "next/image";
import { getHandleInitials } from "@/features/dm/utils/get-handle-initials";

type DmAvatarProps = {
	name: string;
	image?: string | null;
	sizeClassName: string;
	textClassName: string;
};

export function DmAvatar({
	name,
	image,
	sizeClassName,
	textClassName,
}: DmAvatarProps) {
	return (
		<div
			className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 ${sizeClassName} ${textClassName}`}
		>
			{image ? (
				<Image
					src={image}
					alt={name}
					width={56}
					height={56}
					className="h-full w-full object-cover"
				/>
			) : (
				getHandleInitials(name)
			)}
		</div>
	);
}
