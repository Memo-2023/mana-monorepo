import type { Icon } from 'phosphor-react-native';
import {
	CaretLeft as CaretLeftIcon,
	CaretRight as CaretRightIcon,
	ArrowLeft as ArrowLeftIcon,
	CaretDown as CaretDownIcon,
	CaretUp as CaretUpIcon,
	ArrowUp as ArrowUpIcon,
	Microphone as MicrophoneIcon,
	MicrophoneSlash as MicrophoneSlashIcon,
	PencilSimple as PencilSimpleIcon,
	Pencil as PencilIcon,
	ShareFat as ShareFatIcon,
	ArrowClockwise as ArrowClockwiseIcon,
	Plus as PlusIcon,
	PlusCircle as PlusCircleIcon,
	Trash as TrashIcon,
	X as XIcon,
	XCircle as XCircleIcon,
	Check as CheckIcon,
	CheckCircle as CheckCircleIcon,
	DotsThree as DotsThreeIcon,
	DotsThreeVertical as DotsThreeVerticalIcon,
	List as ListIcon,
	Archive as ArchiveIcon,
	Folder as FolderIcon,
	FolderOpen as FolderOpenIcon,
	Gear as GearIcon,
	FileText as FileTextIcon,
	File as FileIcon,
	Image as ImageIcon,
	Camera as CameraIcon,
	Heart as HeartIcon,
	Star as StarIcon,
	Bookmark as BookmarkIcon,
	MagnifyingGlass as MagnifyingGlassIcon,
	Funnel as FunnelIcon,
	ArrowsClockwise as ArrowsClockwiseIcon,
	Play as PlayIcon,
	Pause as PauseIcon,
	Stop as StopIcon,
	MapPin as MapPinIcon,
	Globe as GlobeIcon,
	Translate as TranslateIcon,
	User as UserIcon,
	Users as UsersIcon,
	UserPlus as UserPlusIcon,
	ClipboardText as ClipboardTextIcon,
	Copy as CopyIcon,
	Download as DownloadIcon,
	Cloud as CloudIcon,
	CloudCheck as CloudCheckIcon,
	CloudArrowUp as CloudArrowUpIcon,
	Warning as WarningIcon,
	Info as InfoIcon,
	Question as QuestionIcon,
	Calendar as CalendarIcon,
	Clock as ClockIcon,
	Timer as TimerIcon,
	Envelope as EnvelopeIcon,
	EnvelopeOpen as EnvelopeOpenIcon,
	Lock as LockIcon,
	Key as KeyIcon,
	SignIn as SignInIcon,
	SignOut as SignOutIcon,
	Lightning as LightningIcon,
	Sparkle as SparkleIcon,
	SpeakerHigh as SpeakerHighIcon,
	Waveform as WaveformIcon,
	Tag as TagIcon,
	ChartBar as ChartBarIcon,
	Drop as DropIcon,
	Bug as BugIcon,
	Rocket as RocketIcon,
	Gift as GiftIcon,
	Swap as SwapIcon,
	Eye as EyeIcon,
	Phone as PhoneIcon,
	ShieldCheck as ShieldCheckIcon,
	ChatCircle as ChatCircleIcon,
	MusicNotes as MusicNotesIcon,
	Pulse as PulseIcon,
	TextT as TextTIcon,
	Note as NoteIcon,
	House as HouseIcon,
	Hourglass as HourglassIcon,
	RectangleDashed as RectangleDashedIcon,
	PushPin as PushPinIcon,
	PushPinSlash as PushPinSlashIcon,
	Book as BookIcon,
	ChatCircleDots as ChatCircleDotsIcon,
	ArrowsLeftRight as ArrowsLeftRightIcon,
	ArrowCircleLeft as ArrowCircleLeftIcon,
} from 'phosphor-react-native';

// Map old Ionicons names to Phosphor icon components
// All icons use weight="duotone" for a modern two-tone look
export const iconMap: Record<string, Icon> = {
	// Navigation
	'arrow-circle-left': ArrowCircleLeftIcon,
	'chevron-back': CaretLeftIcon,
	'chevron-forward': CaretRightIcon,
	'chevron-forward-outline': CaretRightIcon,
	'arrow-back': ArrowLeftIcon,
	'arrow-back-outline': ArrowLeftIcon,
	'arrow-forward-outline': CaretRightIcon,
	'chevron-down': CaretDownIcon,
	'chevron-down-outline': CaretDownIcon,
	'chevron-up': CaretUpIcon,
	'chevron-up-outline': CaretUpIcon,
	'arrow-up': ArrowUpIcon,

	// Microphone
	'mic-outline': MicrophoneIcon,
	mic: MicrophoneIcon,
	'mic-off': MicrophoneSlashIcon,

	// Edit / Create
	'create-outline': PencilSimpleIcon,
	create: PencilIcon,
	'pencil-outline': PencilIcon,

	// Share
	'share-outline': ShareFatIcon,

	// Refresh
	refresh: ArrowClockwiseIcon,
	'refresh-outline': ArrowClockwiseIcon,

	// Add
	add: PlusIcon,
	'add-outline': PlusIcon,
	'add-circle': PlusCircleIcon,

	// Delete
	'trash-outline': TrashIcon,
	trash: TrashIcon,

	// Close / X
	close: XIcon,
	'close-outline': XIcon,
	'close-circle': XCircleIcon,
	'close-circle-outline': XCircleIcon,

	// Checkmark
	checkmark: CheckIcon,
	'checkmark-outline': CheckIcon,
	'checkmark-circle': CheckCircleIcon,
	'checkmark-circle-outline': CheckCircleIcon,

	// Dots / Ellipsis
	'ellipsis-horizontal': DotsThreeIcon,
	'ellipsis-vertical': DotsThreeVerticalIcon,

	// Menu / List
	menu: ListIcon,
	'list-outline': ListIcon,
	list: ListIcon,

	// Archive / Folder
	'archive-outline': ArchiveIcon,
	archive: ArchiveIcon,
	'folder-outline': FolderIcon,
	folder: FolderIcon,
	'folder-open': FolderOpenIcon,

	// Settings
	'settings-outline': GearIcon,
	settings: GearIcon,

	// Documents / Files
	'document-text-outline': FileTextIcon,
	'document-text': FileTextIcon,
	'document-outline': FileIcon,
	'reader-outline': NoteIcon,
	'text-outline': TextTIcon,

	// Image / Camera
	'image-outline': ImageIcon,
	image: ImageIcon,
	'camera-outline': CameraIcon,
	camera: CameraIcon,

	// Social
	'heart-outline': HeartIcon,
	heart: HeartIcon,
	'star-outline': StarIcon,
	star: StarIcon,
	'bookmark-outline': BookmarkIcon,
	bookmark: BookmarkIcon,

	// Search / Filter
	'search-outline': MagnifyingGlassIcon,
	search: MagnifyingGlassIcon,
	'filter-outline': FunnelIcon,
	filter: FunnelIcon,
	'sync-outline': ArrowsClockwiseIcon,

	// Media
	play: PlayIcon,
	pause: PauseIcon,
	stop: StopIcon,
	'musical-notes': MusicNotesIcon,
	'volume-high-outline': SpeakerHighIcon,
	'volume-high': SpeakerHighIcon,

	// Location / Globe
	pin: MapPinIcon,
	'pin-outline': MapPinIcon,
	'location-outline': MapPinIcon,
	location: MapPinIcon,
	'globe-outline': GlobeIcon,
	globe: GlobeIcon,

	// Language
	'language-outline': TranslateIcon,
	language: TranslateIcon,

	// People
	'person-outline': UserIcon,
	person: UserIcon,
	'person-add-outline': UserPlusIcon,
	'people-outline': UsersIcon,
	people: UsersIcon,

	// Clipboard / Copy
	'clipboard-outline': ClipboardTextIcon,
	clipboard: ClipboardTextIcon,
	'rectangle-dashed': RectangleDashedIcon,
	'copy-outline': CopyIcon,
	copy: CopyIcon,

	// Download / Upload / Cloud
	'download-outline': DownloadIcon,
	download: DownloadIcon,
	'cloud-outline': CloudIcon,
	cloud: CloudIcon,
	'cloud-done-outline': CloudCheckIcon,
	'cloud-done': CloudCheckIcon,
	'cloud-upload-outline': CloudArrowUpIcon,
	'cloud-upload': CloudArrowUpIcon,

	// Alerts / Info
	'warning-outline': WarningIcon,
	warning: WarningIcon,
	'alert-circle': WarningIcon,
	'alert-circle-outline': WarningIcon,
	'information-circle-outline': InfoIcon,
	'information-circle': InfoIcon,
	'help-circle-outline': QuestionIcon,
	'help-circle': QuestionIcon,

	// Time / Calendar
	'calendar-outline': CalendarIcon,
	'time-outline': ClockIcon,
	time: ClockIcon,
	'timer-outline': TimerIcon,
	'hourglass-outline': HourglassIcon,

	// Mail
	'mail-outline': EnvelopeIcon,
	mail: EnvelopeIcon,
	'mail-open-outline': EnvelopeOpenIcon,

	// Security
	'lock-closed-outline': LockIcon,
	'lock-closed': LockIcon,
	'key-outline': KeyIcon,
	'shield-checkmark': ShieldCheckIcon,

	// Auth
	'log-in-outline': SignInIcon,
	'exit-outline': SignOutIcon,
	'log-out-outline': SignOutIcon,

	// Effects
	'flash-outline': LightningIcon,
	flash: LightningIcon,
	'sparkles-outline': SparkleIcon,
	sparkles: SparkleIcon,

	// Misc
	waveform: WaveformIcon,
	'pulse-outline': PulseIcon,
	'pricetag-outline': TagIcon,
	pricetag: TagIcon,
	'pricetags-outline': TagIcon,
	'analytics-outline': ChartBarIcon,
	'bar-chart-outline': ChartBarIcon,
	'bar-chart': ChartBarIcon,
	'water-outline': DropIcon,
	water: DropIcon,
	'bug-outline': BugIcon,
	rocket: RocketIcon,
	'gift-outline': GiftIcon,
	'swap-horizontal': SwapIcon,
	'eye-outline': EyeIcon,
	'phone-portrait-outline': PhoneIcon,
	'chatbubble-outline': ChatCircleIcon,
	'ellipse-outline': PulseIcon,
	server: CloudIcon,

	// Home
	home: HouseIcon,
	'home-outline': HouseIcon,

	// Pin
	'push-pin': PushPinIcon,
	'push-pin-slash': PushPinSlashIcon,

	// Additional
	book: BookIcon,
	'chat-dots': ChatCircleDotsIcon,
	'arrows-left-right': ArrowsLeftRightIcon,
};

// Helper function to get Phosphor icon component by old Ionicons name
export function getIconComponent(name: string): Icon | undefined {
	return iconMap[name];
}

// Helper to check if icon has mapping
export function hasIconMapping(name: string): boolean {
	return name in iconMap;
}

// Keep backward compatibility
export function getIconMapping(name: string): { ionicon: string } | undefined {
	if (name in iconMap) {
		return { ionicon: name };
	}
	return undefined;
}
