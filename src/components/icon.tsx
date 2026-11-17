// Phosphor icons (light weight by default). Deep imports keep the bundle small.
import type { IconProps } from "phosphor-react-native";
import { AndroidLogoIcon } from "phosphor-react-native/src/icons/AndroidLogo";
import { ArrowLeftIcon } from "phosphor-react-native/src/icons/ArrowLeft";
import { ArrowRightIcon } from "phosphor-react-native/src/icons/ArrowRight";
import { ArrowsLeftRightIcon } from "phosphor-react-native/src/icons/ArrowsLeftRight";
import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { CalendarBlankIcon } from "phosphor-react-native/src/icons/CalendarBlank";
import { CameraIcon } from "phosphor-react-native/src/icons/Camera";
import { CertificateIcon } from "phosphor-react-native/src/icons/Certificate";
import { ChartBarIcon } from "phosphor-react-native/src/icons/ChartBar";
import { CheckCircleIcon } from "phosphor-react-native/src/icons/CheckCircle";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { ChecksIcon } from "phosphor-react-native/src/icons/Checks";
import { CircleIcon } from "phosphor-react-native/src/icons/Circle";
import { ClockIcon } from "phosphor-react-native/src/icons/Clock";
import { CreditCardIcon } from "phosphor-react-native/src/icons/CreditCard";
import { DeviceMobileIcon } from "phosphor-react-native/src/icons/DeviceMobile";
import { EyeIcon } from "phosphor-react-native/src/icons/Eye";
import { FileTextIcon } from "phosphor-react-native/src/icons/FileText";
import { FingerprintIcon } from "phosphor-react-native/src/icons/Fingerprint";
import { FirstAidKitIcon } from "phosphor-react-native/src/icons/FirstAidKit";
import { FolderOpenIcon } from "phosphor-react-native/src/icons/FolderOpen";
import { HeartbeatIcon } from "phosphor-react-native/src/icons/Heartbeat";
import { HouseIcon } from "phosphor-react-native/src/icons/House";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { LeafIcon } from "phosphor-react-native/src/icons/Leaf";
import { LockSimpleIcon } from "phosphor-react-native/src/icons/LockSimple";
import { LockSimpleOpenIcon } from "phosphor-react-native/src/icons/LockSimpleOpen";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { MapPinIcon } from "phosphor-react-native/src/icons/MapPin";
import { NotePencilIcon } from "phosphor-react-native/src/icons/NotePencil";
import { PaperclipIcon } from "phosphor-react-native/src/icons/Paperclip";
import { PhoneIcon } from "phosphor-react-native/src/icons/Phone";
import { PillIcon } from "phosphor-react-native/src/icons/Pill";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { QrCodeIcon } from "phosphor-react-native/src/icons/QrCode";
import { ShareNetworkIcon } from "phosphor-react-native/src/icons/ShareNetwork";
import { ShieldCheckIcon } from "phosphor-react-native/src/icons/ShieldCheck";
import { SignOutIcon } from "phosphor-react-native/src/icons/SignOut";
import { SparkleIcon } from "phosphor-react-native/src/icons/Sparkle";
import { StarIcon } from "phosphor-react-native/src/icons/Star";
import { StethoscopeIcon } from "phosphor-react-native/src/icons/Stethoscope";
import { SunIcon } from "phosphor-react-native/src/icons/Sun";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { UserCircleIcon } from "phosphor-react-native/src/icons/UserCircle";
import { UsersThreeIcon } from "phosphor-react-native/src/icons/UsersThree";
import { WarningCircleIcon } from "phosphor-react-native/src/icons/WarningCircle";
import { WarningIcon } from "phosphor-react-native/src/icons/Warning";
import { XCircleIcon } from "phosphor-react-native/src/icons/XCircle";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { ArrowSquareOutIcon } from "phosphor-react-native/src/icons/ArrowSquareOut";

const MAP = {
  add: PlusIcon, close: XIcon, check: CheckIcon, "check-circle": CheckCircleIcon, checks: ChecksIcon, circle: CircleIcon,
  "arrow-left": ArrowLeftIcon, "arrow-right": ArrowRightIcon, compare: ArrowsLeftRightIcon, external: ArrowSquareOutIcon,
  bell: BellIcon, calendar: CalendarBlankIcon, camera: CameraIcon, certificate: CertificateIcon, chart: ChartBarIcon,
  clock: ClockIcon, card: CreditCardIcon, phone: DeviceMobileIcon, call: PhoneIcon, eye: EyeIcon, file: FileTextIcon,
  attach: PaperclipIcon, fingerprint: FingerprintIcon, medkit: FirstAidKitIcon, folder: FolderOpenIcon, pulse: HeartbeatIcon,
  home: HouseIcon, image: ImageIcon, leaf: LeafIcon, lock: LockSimpleIcon, unlock: LockSimpleOpenIcon, search: MagnifyingGlassIcon,
  pin: MapPinIcon, edit: NotePencilIcon, pill: PillIcon, qr: QrCodeIcon, share: ShareNetworkIcon, shield: ShieldCheckIcon,
  "sign-out": SignOutIcon, sparkle: SparkleIcon, star: StarIcon, stethoscope: StethoscopeIcon, sun: SunIcon, trash: TrashIcon,
  user: UserCircleIcon, users: UsersThreeIcon, alert: WarningCircleIcon, warning: WarningIcon, "x-circle": XCircleIcon,
  android: AndroidLogoIcon,
} as const;

export type IconName = keyof typeof MAP;

export function Icon({ name, size = 20, color, weight = "light", ...rest }: { name: IconName } & IconProps) {
  const C = MAP[name];
  // Decorative by default; meaningful icons get labelled by their parent control.
  return <C size={size} color={color} weight={weight} {...rest} />;
}
