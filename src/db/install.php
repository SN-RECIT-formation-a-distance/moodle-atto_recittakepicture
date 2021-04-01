<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Atto install script. Adds atto_recittakepicture icons to Atto toolbar.
 *
 * @package    atto
 * @subpackage atto_recittakepicture
 * @copyright  RECITFAD
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Enable atto_recittakepicture for Atto buttons on installation.
 */
function xmldb_atto_recittakepicture_install() {
    $toolbar = get_config('editor_atto', 'toolbar');
    if (strpos($toolbar, 'recittakepicture') === false && $toolbar && $toolbar != '') {
        $groups = explode("\n", $toolbar);
        // Try to put vvvebjs in recit group.
        $found = false;
        foreach ($groups as $i => $group) {
            $parts = explode('=', $group);
            if (trim($parts[0]) == 'recit') {
                $groups[$i] = 'recit = ' . trim($parts[1]) . ', recittakepicture';
                $found = true;
            }
        }

        // Otherwise create a recit group at the first position 
        if (!$found) {
            array_unshift($groups, 'recit = recittakepicture');
        }

        // Update config variable.
        $toolbar = implode("\n", $groups);
        set_config('toolbar', $toolbar, 'editor_atto');
    }
}
