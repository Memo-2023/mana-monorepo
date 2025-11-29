import React, { useState } from 'react';

interface Story {
	id: string;
	title: string;
	character: string;
	image: string;
	excerpt: string;
}

interface StoryCardProps {
	story: Story;
}

export default function StoryCard({ story }: StoryCardProps) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div
			className="relative w-60 h-90 cursor-pointer transition-all duration-300"
			style={{
				transform: isHovered ? 'scale(1.02) rotateY(-3deg)' : 'rotateY(-5deg)',
				transformStyle: 'preserve-3d',
				perspective: '1000px',
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className="bg-bg-card rounded-lg overflow-hidden shadow-card hover:shadow-xl transition-shadow">
				{/* Image */}
				<div className="relative h-80 bg-bg-darker">
					<img src={story.image} alt={story.title} className="w-full h-full object-cover" />

					{/* Gradient Overlay */}
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

					{/* Content Overlay */}
					<div className="absolute bottom-0 left-0 right-0 p-4">
						<h3 className="font-grandstander font-bold text-lg text-white mb-1">{story.title}</h3>
						<p className="text-text-light text-sm mb-2">mit {story.character}</p>
						<p className="text-text-secondary text-xs line-clamp-2">{story.excerpt}</p>
					</div>
				</div>

				{/* Play Button Overlay */}
				<div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50">
					<div className="w-16 h-16 bg-yellow-dark rounded-full flex items-center justify-center transform hover:scale-110 transition-transform">
						<svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
							<path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
						</svg>
					</div>
				</div>
			</div>
		</div>
	);
}
