import { Component } from 'solid-js';

interface ContentCardProps {
	title: string;
	speaker: string;
	speakerId?: string;
	duration: string;
	excerpt: string;
	tags: string[];
	link: string;
	date?: string;
	thumbnail?: string;
	views?: string;
}

const ContentCard: Component<ContentCardProps> = (props) => {
	return (
		<a href={props.link} class="group relative flex flex-col h-full cursor-pointer">
			{/* Card Container with hover effects */}
			<article class="glass rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-500 hover:shadow-theme-xl hover:-translate-y-1 border border-theme-border/50 hover:border-theme-primary/30">
				{/* Gradient overlay on hover */}
				<div class="absolute inset-0 bg-gradient-to-br from-theme-primary/5 to-theme-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"></div>

				{/* Content section */}
				<div class="flex-1 p-6 flex flex-col relative z-10">
					{/* Title */}
					<h3 class="text-xl font-bold mb-3 text-theme-text group-hover:text-theme-primary transition-colors duration-300 line-clamp-2">
						{props.title}
					</h3>

					{/* Meta information */}
					<div class="flex items-center gap-3 text-sm text-theme-text-muted mb-3">
						{props.speakerId ? (
							<a
								href={`/speakers/${props.speakerId}`}
								class="flex items-center gap-1 hover:text-theme-primary transition-colors"
								onClick={(e) => {
									e.stopPropagation();
								}}
							>
								<span class="text-base">🎤</span>
								<span class="font-medium">{props.speaker}</span>
							</a>
						) : (
							<span class="flex items-center gap-1">
								<span class="text-base">🎤</span>
								<span class="font-medium">{props.speaker}</span>
							</span>
						)}
						<span class="text-theme-border">•</span>
						<span>⏱️ {props.duration}</span>
						{props.date && (
							<>
								<span class="text-theme-border">•</span>
								<span>{props.date}</span>
							</>
						)}
						{props.views && (
							<>
								<span class="text-theme-border">•</span>
								<span>👁️ {props.views}</span>
							</>
						)}
					</div>

					{/* Excerpt */}
					<p class="text-theme-text-muted mb-4 line-clamp-3 flex-1">{props.excerpt}</p>

					{/* Tags */}
					<div class="flex flex-wrap gap-2 mb-4">
						{props.tags.map((tag) => (
							<span class="px-3 py-1 bg-theme-surface rounded-full text-xs font-medium text-theme-text-muted border border-theme-border/50">
								{tag}
							</span>
						))}
					</div>

					{/* CTA Text (no longer a link since whole card is clickable) */}
					<div class="inline-flex items-center gap-2 text-theme-primary font-semibold transition-all duration-300">
						<span>Weiterlesen</span>
						<svg
							class="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 7l5 5m0 0l-5 5m5-5H6"
							></path>
						</svg>
					</div>
				</div>

				{/* Decorative corner accent */}
				<div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-theme-primary/10 to-transparent rounded-bl-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
			</article>
		</a>
	);
};

export default ContentCard;
