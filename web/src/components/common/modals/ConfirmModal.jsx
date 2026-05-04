/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

For commercial licensing, please contact support@quantumnous.com
*/

/**
 * ConfirmModal — 项目统一的"破坏性 / 不可撤销"操作确认弹窗
 *
 * 用途：删除、立即发送、重置等需要让用户停下来再确认的场景。
 * 不要用于轻量切换（用 Popconfirm 即可）。
 *
 * Props:
 *   - visible        boolean
 *   - type           'danger' | 'warning' | 'info'   默认 'warning'
 *   - title          string | ReactNode
 *   - content        string | ReactNode              说明文案
 *   - okText         string                          确认按钮文案，默认 t('确认')
 *   - cancelText     string                          取消按钮文案，默认 t('取消')
 *   - okButtonProps  object                          额外透传给 OK 按钮（如 loading）
 *   - onOk           () => void | Promise<void>      点击确认。返回 promise 时 OK 按钮自动 loading
 *   - onCancel       () => void
 *   - width          number | string                 默认 416
 */
import React, { useState, useCallback } from 'react';
import { Modal } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

const ConfirmModal = ({
  visible,
  type = 'warning',
  title,
  content,
  okText,
  cancelText,
  okButtonProps,
  onOk,
  onCancel,
  width = 416,
}) => {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  const handleOk = useCallback(async () => {
    if (!onOk) return;
    try {
      const ret = onOk();
      if (ret && typeof ret.then === 'function') {
        setSubmitting(true);
        await ret;
      }
    } finally {
      setSubmitting(false);
    }
  }, [onOk]);

  const semiType = type === 'danger' ? 'warning' : type;

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      title={title}
      type={semiType}
      width={width}
      okText={okText || t('确认')}
      cancelText={cancelText || t('取消')}
      okButtonProps={{
        type: type === 'danger' ? 'danger' : 'primary',
        theme: 'solid',
        loading: submitting,
        ...okButtonProps,
      }}
      maskClosable={false}
      centered
    >
      {content}
    </Modal>
  );
};

export default ConfirmModal;
