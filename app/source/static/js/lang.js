// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

var $L = {
	'jp' : {
		'RULE' : 'ルール',
		'EXCHANGE' : '交換',
		'DIVIDEND' : '分配',
		'TYPE' : 'タイプ',
		'TRIGGER_OF_EVENT' : 'イベント発生タイミング',
		'BY_REQUEST_OF_OWNER' : '所有者の依頼によって',
		'NONE' : 'なし',
		'BY_COMPLETION_OF_TASK'　: 'タスクの完了によって',
		'BY_NUMBER_OF_OWNED' : 'CIPHERの所有トークン数が一定数を超えることによって',
		'TASK_ID' : 'タスクID',
		'TOKEN_ID' : 'トークンID',
		'MINIMUM_TOKEN' : '必要トークン数',
		'TRANSFERED_CONTENT' : '分配・配布内容',
		'TARGET_CONTENT' : '対象物',
		'QUANTITY' : '量', 
		'QRCODE' : 'QRコード',
		'TOKEN' : 'トークン',
		'CRYPTOCURRENCY' : '暗号通貨',
		'TRANSFER' : '送金', 
		'SPECIFIED_NUMBER' : '指定数',
		'ISSUED_PER_SPECIFIED' : '発行数／指定数',
		'ID' : 'ID',
		'NAME1' : '名称',
		'DESC' : '概要',
		'REWARD' : '報酬',
		'PIC' : '担当者',
		'TASK_GROUP' : 'タスクグループ',
		'APPROVED' : '承認済',
		'RECENT' : '最新', 
		'APPROVE' : '承認',
		'PIC_APPROVE_STATE' : '担当者の承認状況',
		'REVIEW_STATE' : 'レビュー状況',
		'ALL_MEMBER' : '全員',
		'NOONE' : '対象なし',
		'CREATE' : '作成',
		'SELECT' : '選択',
		'CANCEL' : 'キャンセル',
		'GOVRULE' : '統治ルール',
		'CIPHER' : 'サイファー',
		'TASK' : 'タスク',
		'PURPOSE' : '目的',
		'DECISION_RULE' : '意思決定ルール',
		'BACK' : '戻る',
		'COMMIT': '反映',
		'NOT_SET': '未設定',
		'VERSION' : 'バージョン',
		'DRAFT_NO' : '案No.',
		'DRAFT_EDIT_MEMBER' : '案作成メンバー',
		'REQ_NUM_AUTHORS' : '必須承認数',
		'AUTHORS' : '承認者一覧',
		'NEW' : '新規',
		'REVOKE' : '破棄',
		'RELOAD' : 'リロード',
		'RULELIST' : 'ルール一覧',
		'NAME2' : '名前',
		'PASSWORD' : 'パスワード',
		'PASS_FOR_CONF' : '確認用',
		'REGISTER' : '登録',
		'LOGIN' : 'ログイン',
		'REVERT_APPROVE' : '承認取消',
		'NEW_DRAFT' : '新案作成',
		'REWARD_TYPE' : '報酬タイプ',
		'REWARD_REQUIREMENT' : '報酬条件',
		'PIC_APPROVE' : '担当者を承認',
		'PIC_APPROVE_REV' : '担当者承認を取消',
		'REVIEW_APPROVE' : '結果を承認',
		'REVIEW_APPROVE_REV' : '結果承認を取消',
		'APPLY1' : '志願',
		'CANCEL_APPLY1' : '志願取消',
		'CURRENT1' : '現行',
		'DRAFT1' : 'ドラフト',
		'HISTORY1' : '履歴',
		'EDITOR' : '編集者',
		'SEARCH_TARGET' : '検索対象',
		'SEARCH_WORDS' : '検索ワード',
		'SEARCH' : '検索',
		'LOGOUT' : 'ログアウト',
		'RUNNING' : '運営中',
		'EDIT' : '編集',
		'CREATE_CIPHER' : 'サイファー作成',
		'HOME' : 'ホーム',
		'WALLET' : 'ウォレット',
		'ACCOUNT' : 'アカウント',
		'KEYS' : 'キー',
		'KEY' : 'キー',
		'LOCKSTATE' : 'ロック状態',
		'OPEN_WALLET' : '開く',
		'BROWSE' : '閲覧',
		'USER' : 'ユーザー',
		'ATTRIBUTES' : '属性',
		'PUB_KEY_ACTIVE' : '公開鍵(active)',
		'NET_STAKE' : 'Net Stake',
		'CPU_STAKE' : 'CPU Stake',
		'RAM_PURCHASE' : 'RAM購入',
		'TAGS' : 'タグ',

		'INVALID_PARAM' : '入力値が正しくありません',
		'PASS_DIFFER_FROM_CONF' : 'パスワードと確認用パスワードが一致していません。',
		'ID_INVALID_FORM' : 'IDは半角英字（大文字、小文字）、数字、「_」のみが使用できます。６文字以上にする必要があります。',
		'PASS_INVALID_FORM' : 'パスワードは半角英字（小文字）、「!"#$%&\'()+-*?」数字のみが使用できます。６文字以上にする必要があります。',
		'NAME_INVALID_FORM' : '名前は３２文字以下にする必要があります。',
		'INVALID_ID_OR_PASS' :  'IDまたはパスワードに誤りがあります。',
		'FAILED_TO_LOGIN' : 'ログインに失敗しました。',
		'SYS_ERROR' : 'システムのエラーが発生しました。',
		'ALREADY_REGISTERED' : 'すでに登録されています。',
		'FAILED_TO_AUTH' : '認証に失敗しました。ログインし直してください。',
		'NOT_HAVE_UPDATE_AUTH' : '更新権限がありません。',
		'NOT_HAVE_APPROVE_AUTH' : '承認権限がありません。',
		'ALREADY_APPROVED' : '既に承認済みです。',
		'NOT_APPROVE_YET' : '承認していません。',
		'ALREADY_BEEN_FORMAL' : '既に正式版になっているため、更新できません。',
		'CANT_USE_FOR_SOURCE' : 'このデータは、コピー元として使用できません。（正式版、または正式版より新しい版の案のみ使用できます。）',
		'NOT_EXIST' : 'データが存在しません。',
		'NOT_EDITABLE' : 'このドラフトは編集不可能です。',
		'ALREADY_APPLIED' : 'すでに候補者が設定されています。',
		'NOT_SET_TO_PIC' : '担当者に設定されていません',
		'ALREADY_FULFILL_REQ' : 'すでに承認されています。',
		'PIC_NOT_SET' : '担当者が設定されていません。',
		'NOT_CURRENT' : '現行版ではありません。',
		'TASK_ALREADY_COMPLETED' : 'タスクは既に完了しています。',
		'THERE_IS_INCONSISTENT' : 'データに不整合があります。',
		'CIPHER_NOT_FORMAL_YET' : 'CIPHERはまだ正式となっていません。',
		'PIC_NOT_APPROVED' : '担当者が承認されていません。',
		'USER_NOT_LOGIN' : 'ログインしていません。',
		'REQ_BIGGER_THAN_AUTH' : '必要承認数が大きすぎます。',
		'AUTH_NOT_SET' : '承認者が設定されていません。',
		'SEARCH_TARGET_NOT_SET' : '検索対象が設定されていません。',
		'INVALID_KEY' : 'キーが正しくありません。',
		'FAILED_TO_GET_DATA' : 'データの取得に失敗しました。',
		'@' : ''
	}
};

var __r = [
	/#0#/mg, /#1#/mg, /#2#/mg, /#3#/mg, /#4#/mg,
	/#5#/mg, /#6#/mg, /#7#/mg, /#8#/mg, /#9#/mg
];

function _L(id, prm) {
	var w = $L['jp'][id]||'';
	prm = prm||[];
	for ( var i=0; i<prm.length; i++) {
		w = w.replace(__r[i], prm[i]);
	}
	return w;
}
