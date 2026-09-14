const ru = {
	// common
	'common.appName': 'app',
	'common.loading': 'Загрузка…',
	'common.save': 'Сохранить',
	'common.cancel': 'Отмена',

	// nav
	'nav.dashboard': 'Панель',
	'nav.pricing': 'Тарифы',
	'nav.signOut': 'Выйти',
	'nav.signIn': 'Войти',

	// auth
	'auth.login.title': 'Вход',
	'auth.login.submit': 'Войти',
	'auth.login.noAccount': 'Нет аккаунта?',
	'auth.login.hasAccount': 'Уже есть аккаунт?',
	'auth.register.title': 'Регистрация',
	'auth.register.submit': 'Создать аккаунт',
	'auth.email': 'Email',
	'auth.password': 'Пароль',
	'auth.name': 'Имя',
	'auth.google': 'Продолжить через Google',
	'auth.or': 'или',
	'auth.error.generic': 'Что-то пошло не так, попробуйте ещё раз',

	// price
	'price.title': 'Тарифы',
	'price.subtitle': 'Начните бесплатно — апгрейдитесь, когда понадобится',
	'price.perMonth': '/мес',
	'price.choose': 'Выбрать',
	'price.free.name': 'Free',
	'price.free.f1': '1 проект',
	'price.free.f2': 'Базовая аналитика',
	'price.pro.name': 'Pro',
	'price.pro.f1': 'Безлимит проектов',
	'price.pro.f2': 'Приоритетная поддержка',

	// ru.ts — добавить в объект
	'billing.cancel': 'Отменить подписку',
	'billing.cancelConfirm':
		'Отменить подписку? Доступ сохранится до конца оплаченного периода.',
	'billing.cancelled': 'Подписка отменена',
	'common.copy': 'Копировать',
	'common.copied': 'Скопировано',
	'theme.toggle': 'Тема',
	'theme.light': 'Светлая',
	'theme.dark': 'Тёмная',
	'landing.faq.title': 'Частые вопросы',

	'common.retry': 'Попробовать снова',
	'landing.testimonials.title': 'Отзывы',
	'landing.cta.title': 'Начните прямо сейчас',
	'landing.cta.subtitle':
		'Бесплатный тариф без карты. Апгрейд за минуту, когда понадобится.',

	// language
	'lang.switch': 'Язык'
} as const

export type DictionaryKey = keyof typeof ru
export type Dictionary = Record<DictionaryKey, string>

export default ru
