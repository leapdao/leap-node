/**
 * Copyright (c) 2020-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

module.exports = slots => slots.filter(s => s && !s.activationEpoch);
