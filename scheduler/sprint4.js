// ─────────────────────────────────────────────
//   CONSTANTS & STATE
// ─────────────────────────────────────────────
const BASE_YEAR = new Date().getFullYear();
const YEARS = [BASE_YEAR, BASE_YEAR + 1, BASE_YEAR + 2];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let scheduleCount = 0;

// ─────────────────────────────────────────────
//   DATE UTILITIES
// ─────────────────────────────────────────────
/**
 * Normalizes any date to the Monday of that week.
 */
function getMondayOfWeek(date) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    
    // Adjust day offset so Monday becomes 0, handling Sunday (0) separately
    const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    targetDate.setDate(targetDate.getDate() + offsetToMonday);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate;
}

function fmtShort(date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

function weekKey(monday) {
    return monday.toISOString().split('T')[0];
}

/**
 * Generates an index map of all Mondays grouped by their respective months for a given year.
 */
function getMondaysForYear(year) {
    const janFirst = new Date(year, 0, 1);
    let weekCursor = getMondayOfWeek(janFirst);
    
    // Ensure we start cleanly inside the targeted calendar year
    if (weekCursor.getFullYear() < year) {
        weekCursor.setDate(weekCursor.getDate() + 7);
    }

    const months = [];
    const monthMap = {};

    while (weekCursor.getFullYear() === year) {
        const currentMonth = weekCursor.getMonth();
        
        if (!monthMap[currentMonth]) {
            monthMap[currentMonth] = [];
            months.push(currentMonth);
        }
        
        monthMap[currentMonth].push(new Date(weekCursor));
        weekCursor.setDate(weekCursor.getDate() + 7);
    }
    
    return { months, monthMap };
}

// ─────────────────────────────────────────────
//   INITIALIZATION
// ─────────────────────────────────────────────
document.getElementById('btn-new-schedule').addEventListener('click', createSchedule);

// ─────────────────────────────────────────────
//   SCHEDULE BUILDER
// ─────────────────────────────────────────────
function createSchedule() {
    scheduleCount++;
    const currentId = scheduleCount;
    
    const block = document.createElement('section');
    block.className = 'schedule-block';
    block.id = `schedule-${currentId}`;
    block.innerHTML = buildScheduleHTML(currentId);
    
    document.getElementById('schedules-container').appendChild(block);
    attachScheduleEvents(block, currentId);
    
    block.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildScheduleHTML(id) {
    // Top bar stat pills summarizing multi-year data distributions
    const statPills = YEARS.map(year => `
        <div class="hs-item">
            <span class="hs-label">${year}</span>
            <span class="hs-cost" data-year="${year}">—</span>
        </div>
    `).join('') + `
        <div class="hs-item hs-total">
            <span class="hs-label">Campaign</span>
            <span class="campaign-display">$0.00</span>
        </div>
    `;

    // Overview cards mapped to bottom layout section
    const yearCards = YEARS.map(year => `
        <div class="cost-card year-stat" data-year="${year}">
            <div class="cc-label">${year}</div>
            <div class="year-stat-cost">—</div>
            <div class="year-stat-weeks">0 weeks</div>
        </div>
    `).join('');

    return `
        <div class="schedule-header">
            <button class="btn-toggle" title="Collapse / Expand">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>
            <input class="schedule-name" type="text" value="Schedule ${id}"
                   spellcheck="false" aria-label="Schedule name">
            <div class="header-stats">${statPills}</div>
            <button class="btn-delete-schedule">&#10005; Remove</button>
        </div>

        <div class="schedule-body">
            <div class="step-section">
                <div class="step-label"><span class="step-number">1</span> Build Your Weekly Schedule</div>
                <div class="schedule-table-wrap">
                    <table class="schedule-table">
                        <thead>
                            <tr>
                                <th>
                                    <div class="daypart-column">
                                        <span>Day Part</span>
                                        <button class="daypart-add-btn" type="button">+ Add Daypart</button>
                                    </div>
                                </th>
                                <th>Ads/Wk</th>
                                <th>Duration</th>
                                <th>Mon</th><th>Tue</th><th>Wed</th>
                                <th>Thu</th><th>Fri</th><th>Sat</th><th>Sun</th>
                                <th>Rate</th>
                                <th>Cost/Wk</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>${defaultRows()}</tbody>
                        <tfoot>
                            <tr>
                                <td>Weekly Total</td>
                                <td class="total-ads-wk">0</td>
                                <td></td>
                                <td class="total-mon">0</td><td class="total-tue">0</td>
                                <td class="total-wed">0</td><td class="total-thu">0</td>
                                <td class="total-fri">0</td><td class="total-sat">0</td>
                                <td class="total-sun">0</td>
                                <td></td>
                                <td class="weekly-cost-display">$0.00</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div class="step-section">
                <div class="step-label"><span class="step-number">2</span> Choose Which Weeks This Schedule Runs</div>
                <div class="year-nav">
                    <div class="year-tabs"></div>
                    <div class="year-quick-btns">
                        <button class="btn-all-year">Select All</button>
                        <button class="btn-clear-year">Clear</button>
                    </div>
                </div>
                <div class="week-grids"></div>

                <div class="cost-summary">
                    ${yearCards}
                    <div class="cost-card campaign-card">
                        <div class="cc-label">Campaign Total</div>
                        <strong class="body-campaign">$0.00</strong>
                        <div class="campaign-total-weeks-label">0 weeks</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ─────────────────────────────────────────────
//   EVENT MANAGEMENT
// ─────────────────────────────────────────────
function attachScheduleEvents(block, id) {
    const bodyContainer = block.querySelector('.schedule-body');
    const tabsContainer = block.querySelector('.year-tabs');
    const gridsContainer = block.querySelector('.week-grids');

    // Section view collapse toggle
    block.querySelector('.btn-toggle').addEventListener('click', () => {
        const isCollapsed = block.classList.toggle('collapsed');
        bodyContainer.style.display = isCollapsed ? 'none' : '';
    });

    // Generate navigation tabs and interactive year calendars
    YEARS.forEach((year, index) => {
        const tabButton = document.createElement('button');
        tabButton.className = `year-tab${index === 0 ? ' active' : ''}`;
        tabButton.dataset.year = String(year);
        tabButton.innerHTML = `${year}<span class="year-count"></span>`;
        
        tabButton.addEventListener('click', () => {
            block.querySelectorAll('.year-tab').forEach(tab => tab.classList.remove('active'));
            tabButton.classList.add('active');
            
            block.querySelectorAll('.year-grid').forEach(grid => {
                grid.style.display = grid.dataset.year === String(year) ? '' : 'none';
            });
        });
        tabsContainer.appendChild(tabButton);

        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'year-grid';
        gridWrapper.dataset.year = String(year);
        if (index !== 0) gridWrapper.style.display = 'none';
        
        buildYearGrid(year, gridWrapper, block, id);
        gridsContainer.appendChild(gridWrapper);
    });

    // Media Data Matrix Event Routing
    const dataTable = block.querySelector('.schedule-table');
    
    dataTable.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-remove-row')) {
            event.target.closest('tr')?.remove();
            recalc(block, id);
        }
    });

    dataTable.addEventListener('input', (event) => {
        const row = event.target.closest('tr');
        if (row?.closest('tbody')) {
            calcRow(row);
            recalc(block, id);
        }
    });

    dataTable.addEventListener('focusout', (event) => {
        if (event.target.classList.contains('rate')) {
            const cleanValue = parseFloat(event.target.innerText.replace(/[$,]/g, '')) || 0;
            event.target.innerText = `$${cleanValue.toFixed(2)}`;
            
            const row = event.target.closest('tr');
            if (row) {
                calcRow(row);
            }
            recalc(block, id);
        }
    });

    block.querySelector('.daypart-add-btn').addEventListener('click', () => {
        dataTable.querySelector('tbody').insertAdjacentHTML('beforeend', buildRowHTML());
    });

    block.querySelector('.btn-delete-schedule').addEventListener('click', () => {
        if (confirm('Remove this schedule?')) {
            block.remove();
            calcGrandTotal();
        }
    });

    // Global Batch Updates (Contextually targets active tabs only)
    block.querySelector('.btn-all-year').addEventListener('click', () => {
        const activeYear = getActiveYear(block);
        block.querySelectorAll(`.year-grid[data-year="${activeYear}"] .week-checkbox`).forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.checked = true;
                checkbox.closest('.week-cell').classList.add('checked');
            }
        });
        recalc(block, id);
    });

    block.querySelector('.btn-clear-year').addEventListener('click', () => {
        const activeYear = getActiveYear(block);
        block.querySelectorAll(`.year-grid[data-year="${activeYear}"] .week-checkbox`).forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                checkbox.closest('.week-cell').classList.remove('checked');
            }
        });
        recalc(block, id);
    });
}

function getActiveYear(block) {
    return block.querySelector('.year-tab.active').dataset.year;
}

// ─────────────────────────────────────────────
//   CALENDAR MATRIX COMPILER
// ─────────────────────────────────────────────
function buildYearGrid(year, container, block, scheduleId) {
    const { months, monthMap } = getMondaysForYear(year);
    const maxCols = Math.max(...months.map(m => monthMap[m].length));

    const htmlTable = document.createElement('table');
    htmlTable.className = 'week-grid-table';

    // Build Table Header Row
    const headerElement = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    appendTableHeaderCell(headerRow, 'Month', 'th-month');
    for (let columnIdx = 1; columnIdx <= maxCols; columnIdx++) {
        appendTableHeaderCell(headerRow, `Wk ${columnIdx}`);
    }
    appendTableHeaderCell(headerRow, '', 'th-quick');
    appendTableHeaderCell(headerRow, 'Mo. Cost', 'th-cost');
    
    headerElement.appendChild(headerRow);
    htmlTable.appendChild(headerElement);

    // Build Table Body Rows (Iterate Months)
    const bodyElement = document.createElement('tbody');
    
    months.forEach(monthKey => {
        const monthMondays = monthMap[monthKey];
        const dataRow = document.createElement('tr');

        const labelCell = document.createElement('td');
        labelCell.className = 'month-label-cell';
        labelCell.textContent = MONTH_NAMES[monthKey];
        dataRow.appendChild(labelCell);

        // Generate distribution columns across standard width
        for (let columnIdx = 0; columnIdx < maxCols; columnIdx++) {
            const cell = document.createElement('td');
            
            if (monthMondays[columnIdx]) {
                const currentMonday = monthMondays[columnIdx];
                cell.className = 'week-cell';

                const layoutInner = document.createElement('div');
                layoutInner.className = 'week-cell-inner';

                const textLabel = document.createElement('span');
                textLabel.className = 'week-date-label';
                textLabel.textContent = fmtShort(currentMonday);

                const inputCheckbox = document.createElement('input');
                inputCheckbox.type = 'checkbox';
                inputCheckbox.className = 'week-checkbox';
                inputCheckbox.dataset.key = weekKey(currentMonday);

                inputCheckbox.addEventListener('change', () => {
                    cell.classList.toggle('checked', inputCheckbox.checked);
                    recalc(block, scheduleId);
                });
                
                cell.addEventListener('click', (event) => {
                    if (event.target !== inputCheckbox) {
                        inputCheckbox.click();
                    }
                });

                layoutInner.appendChild(textLabel);
                layoutInner.appendChild(inputCheckbox);
                cell.appendChild(layoutInner);
            } else {
                cell.className = 'empty-cell';
            }
            dataRow.appendChild(cell);
        }

        // Quick Selector Controllers (Row Level)
        const shortcutCell = document.createElement('td');
        shortcutCell.className = 'month-quick-cell';

        const selectAllBtn = document.createElement('button');
        selectAllBtn.className = 'btn-month-quick';
        selectAllBtn.textContent = 'All';
        selectAllBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            dataRow.querySelectorAll('.week-cell .week-checkbox').forEach(cb => {
                cb.checked = true;
                cb.closest('.week-cell').classList.add('checked');
            });
            recalc(block, scheduleId);
        });

        const clearAllBtn = document.createElement('button');
        clearAllBtn.className = 'btn-month-quick';
        clearAllBtn.textContent = 'None';
        clearAllBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            dataRow.querySelectorAll('.week-cell .week-checkbox').forEach(cb => {
                cb.checked = false;
                cb.closest('.week-cell').classList.remove('checked');
            });
            recalc(block, scheduleId);
        });

        shortcutCell.appendChild(selectAllBtn);
        shortcutCell.appendChild(clearAllBtn);
        dataRow.appendChild(shortcutCell);

        // Individual Monthly Aggregate Display Indicator
        const financeCell = document.createElement('td');
        financeCell.className = 'month-cost-cell';
        financeCell.textContent = '—';
        dataRow.appendChild(financeCell);

        bodyElement.appendChild(dataRow);
    });
    htmlTable.appendChild(bodyElement);

    // Context Summary Footer Matrix Definition
    const footerElement = document.createElement('tfoot');
    const footerRow = document.createElement('tr');
    const footerCell = document.createElement('td');
    
    footerCell.colSpan = maxCols + 3;
    footerCell.className = 'year-tfoot-cell';
    footerCell.innerHTML = `
        <span class="year-total-label">${year}</span>
        &nbsp;·&nbsp;
        <span class="year-total-weeks">0 weeks</span>
        &nbsp;·&nbsp;
        <span class="year-total-cost">$0.00</span>
    `;
    
    footerRow.appendChild(footerCell);
    footerElement.appendChild(footerRow);
    htmlTable.appendChild(footerElement);

    container.appendChild(htmlTable);
}

function appendTableHeaderCell(row, text, className) {
    const tableHeader = document.createElement('th');
    tableHeader.textContent = text;
    if (className) {
        tableHeader.className = className;
    }
    row.appendChild(tableHeader);
}

// ─────────────────────────────────────────────
//   TEMPLATE STRUCTS
// ─────────────────────────────────────────────
function defaultRows() {
    const initialDayparts = [
        'Mornings (7am–10am)',
        'Middays (10am–3pm)',
        'Afternoons (3pm–6:30pm)',
        'Sa–Su (9am–2pm)',
        'M–Su (12am–12pm Bonus)'
    ];
    return initialDayparts.map(label => buildRowHTML(label)).join('');
}

function buildRowHTML(label = '') {
    return `
        <tr>
            <td contenteditable="true">${label}</td>
            <td class="ads" contenteditable="false">0</td>
            <td>
                <select name="duration">
                    <option>:15</option>
                    <option selected>:30</option>
                    <option>:45</option>
                    <option>:60</option>
                </select>
            </td>
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
            <td class="rate" contenteditable="true"></td>
            <td class="cost" contenteditable="false">$0.00</td>
            <td><button class="btn-remove-row">&#10005;</button></td>
        </tr>
    `;
}

// ─────────────────────────────────────────────
//   CALCULATION IMPLEMENTATIONS
// ─────────────────────────────────────────────
/**
 * Processes inputs for a singular daypart row to find its weekly count and total cost.
 */
function calcRow(row) {
    let rawAdSum = 0;
    
    // Day columns occupy indices 3 through 9 in the row cell map
    for (let colIndex = 3; colIndex <= 9; colIndex++) {
        rawAdSum += parseFloat(row.cells[colIndex].innerText) || 0;
    }
    
    row.cells[1].innerText = rawAdSum;
    
    const operationalRate = parseFloat(row.cells[10].innerText.replace(/[$,]/g, '')) || 0;
    const computedWeeklyCost = rawAdSum * operationalRate;
    
    row.cells[11].innerText = `$${computedWeeklyCost.toFixed(2)}`;
}

/**
 * Executes a top-down re-calculation of structural matrix numbers, allocations, and sums.
 */
function recalc(block, id) {
    // 1. Process and sum table dynamic rows
    const dataMetrics = { ads: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, totalWeeklyCost: 0 };
    
    block.querySelectorAll('.schedule-table tbody tr').forEach(row => {
        const getCellValue = (index) => parseFloat(row.cells[index].innerText.replace(/[$,]/g, '')) || 0;
        
        dataMetrics.ads += getCellValue(1);
        dataMetrics.mon += getCellValue(3); 
        dataMetrics.tue += getCellValue(4); 
        dataMetrics.wed += getCellValue(5); 
        dataMetrics.thu += getCellValue(6);
        dataMetrics.fri += getCellValue(7); 
        dataMetrics.sat += getCellValue(8); 
        dataMetrics.sun += getCellValue(9);
        dataMetrics.totalWeeklyCost += getCellValue(11);
    });

    // Sync elements mapped to the weekly breakdown table layout
    block.querySelector('.total-ads-wk').innerText = dataMetrics.ads;
    block.querySelector('.total-mon').innerText    = dataMetrics.mon;
    block.querySelector('.total-tue').innerText    = dataMetrics.tue;
    block.querySelector('.total-wed').innerText    = dataMetrics.wed;
    block.querySelector('.total-thu').innerText    = dataMetrics.thu;
    block.querySelector('.total-fri').innerText    = dataMetrics.fri;
    block.querySelector('.total-sat').innerText    = dataMetrics.sat;
    block.querySelector('.total-sun').innerText    = dataMetrics.sun;
    block.querySelector('.weekly-cost-display').innerText = `$${dataMetrics.totalWeeklyCost.toFixed(2)}`;

    // 2. Cascade down totals to each individual calendar grid section
    let totalAggregatedWeeks = 0;
    
    YEARS.forEach(year => {
        const yearGrid = block.querySelector(`.year-grid[data-year="${year}"]`);
        if (!yearGrid) return;

        let activeWeeksInYear = 0;
        
        yearGrid.querySelectorAll('tbody tr').forEach(row => {
            const activeChecksCount = row.querySelectorAll('.week-checkbox:checked').length;
            activeWeeksInYear += activeChecksCount;
            
            const monthCostIndicator = row.querySelector('.month-cost-cell');
            if (monthCostIndicator) {
                monthCostIndicator.textContent = activeChecksCount > 0 
                    ? `$${(activeChecksCount * dataMetrics.totalWeeklyCost).toFixed(2)}` 
                    : '—';
            }
        });

        const activeYearlyCost = activeWeeksInYear * dataMetrics.totalWeeklyCost;
        totalAggregatedWeeks += activeWeeksInYear;

        // Sync Year Matrix Footer Elements
        const footerWeeksDisplay = yearGrid.querySelector('.year-total-weeks');
        const footerCostDisplay = yearGrid.querySelector('.year-total-cost');
        
        if (footerWeeksDisplay) {
            footerWeeksDisplay.textContent = `${activeWeeksInYear} week${activeWeeksInYear !== 1 ? 's' : ''}`;
        }
        if (footerCostDisplay) {
            footerCostDisplay.textContent = `$${activeYearlyCost.toFixed(2)}`;
        }

        // Sync Target Tab Badges
        const targetTabBadge = block.querySelector(`.year-tab[data-year="${year}"] .year-count`);
        if (targetTabBadge) {
            targetTabBadge.textContent = activeWeeksInYear > 0 ? ` (${activeWeeksInYear})` : '';
        }

        // Sync Persistent Header Indicator Elements
        const headerStaticCostEl = block.querySelector(`.hs-cost[data-year="${year}"]`);
        if (headerStaticCostEl) {
            headerStaticCostEl.textContent = activeWeeksInYear > 0 ? `$${activeYearlyCost.toFixed(2)}` : '—';
        }

        // Sync Summary Detail Section Cards
        const lowerOverviewCard = block.querySelector(`.year-stat[data-year="${year}"]`);
        if (lowerOverviewCard) {
            lowerOverviewCard.querySelector('.year-stat-weeks').textContent = `${activeWeeksInYear} week${activeWeeksInYear !== 1 ? 's' : ''}`;
            lowerOverviewCard.querySelector('.year-stat-cost').textContent = activeWeeksInYear > 0 ? `$${activeYearlyCost.toFixed(2)}` : '—';
        }
    });

    // 3. Finalize campaign aggregates
    const overallCampaignCost = totalAggregatedWeeks * dataMetrics.totalWeeklyCost;
    const formattedWeeksLabel = `${totalAggregatedWeeks} week${totalAggregatedWeeks !== 1 ? 's' : ''} total`;

    // Write-out update targets across tracking wrappers
    block.querySelector('.campaign-display').textContent = `$${overallCampaignCost.toFixed(2)}`;
    block.querySelector('.body-campaign').textContent     = `$${overallCampaignCost.toFixed(2)}`;
    block.querySelector('.campaign-total-weeks-label').textContent = formattedWeeksLabel;

    calcGrandTotal();
}

/**
 * Calculates global summaries by looking across active header tracking metrics.
 */
function calcGrandTotal() {
    let grandFinancialSum = 0;
    
    document.querySelectorAll('.campaign-display').forEach(displayNode => {
        grandFinancialSum += parseFloat(displayNode.textContent.replace(/[$,]/g, '')) || 0;
    });
    
    document.getElementById('campaign-total').textContent = `$${grandFinancialSum.toFixed(2)}`;
}