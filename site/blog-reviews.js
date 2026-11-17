(() => {
  'use strict';

  const widget = document.getElementById('blog-review-widget');
  if (!widget) return;

  const cfg = window.MILA_SUPABASE_CONFIG || {};
  const postId = widget.dataset.postId;
  const form = document.getElementById('blog-review-form');
  const picker = document.getElementById('review-star-picker');
  const ratingNote = document.getElementById('review-rating-note');
  const formMessage = document.getElementById('review-form-message');
  const successMessage = document.getElementById('review-success');
  const reviewList = document.getElementById('review-list');
  const submitButton = document.getElementById('review-submit');
  const averageEl = document.getElementById('review-average');
  const countEl = document.getElementById('review-count');
  const summaryStars = document.getElementById('review-summary-stars');
  const submittedKey = 'mila-blog-review-submitted:' + postId;
  const visitorKey = 'mila-blog-review-visitor:v1';
  let selectedRating = 0;
  let client = null;

  function formatRating(value) {
    return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
  }

  function updateStarFills(container, rating) {
    container.querySelectorAll('.review-star').forEach((star, index) => {
      const fill = star.querySelector('.review-star-fill');
      const amount = Math.max(0, Math.min(1, rating - index));
      if (fill) fill.style.width = (amount * 100) + '%';
    });
  }

  function addStarVisual(container, rating, interactive) {
    container.replaceChildren();
    for (let index = 0; index < 5; index += 1) {
      const star = document.createElement('span');
      star.className = 'review-star' + (interactive ? ' review-star-interactive' : ' review-star-static');
      const base = document.createElement('span');
      base.className = 'review-star-base';
      base.textContent = '★';
      base.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('span');
      fill.className = 'review-star-fill';
      fill.textContent = '★';
      fill.setAttribute('aria-hidden', 'true');
      star.append(base, fill);

      if (interactive) {
        [0.5, 1].forEach((part, partIndex) => {
          const value = index + part;
          const hit = document.createElement('button');
          hit.type = 'button';
          hit.className = 'review-star-hit ' + (partIndex === 0 ? 'review-star-hit-left' : 'review-star-hit-right');
          hit.dataset.rating = String(value);
          hit.setAttribute('aria-label', formatRating(value) + ' von 5 Sternen');
          hit.setAttribute('aria-pressed', 'false');
          hit.addEventListener('pointerenter', () => {
            updateStarFills(container, value);
            ratingNote.textContent = 'Vorschau: ' + formatRating(value) + ' von 5 Sternen';
          });
          hit.addEventListener('focus', () => {
            updateStarFills(container, value);
            ratingNote.textContent = 'Auswahl: ' + formatRating(value) + ' von 5 Sternen';
          });
          hit.addEventListener('click', () => {
            selectedRating = value;
            updateStarFills(container, selectedRating);
            ratingNote.textContent = 'Deine Bewertung: ' + formatRating(selectedRating) + ' von 5 Sternen';
            container.querySelectorAll('.review-star-hit').forEach((button) => {
              button.setAttribute('aria-pressed', String(Number(button.dataset.rating) === selectedRating));
            });
          });
          star.appendChild(hit);
        });
      }
      container.appendChild(star);
    }
    updateStarFills(container, rating || 0);
  }

  picker.addEventListener('pointerleave', () => {
    updateStarFills(picker, selectedRating);
    ratingNote.textContent = selectedRating
      ? 'Deine Bewertung: ' + formatRating(selectedRating) + ' von 5 Sternen'
      : 'Wähle zwischen einem halben und fünf Sternen.';
  });
  picker.addEventListener('focusout', (event) => {
    if (!picker.contains(event.relatedTarget)) {
      updateStarFills(picker, selectedRating);
      ratingNote.textContent = selectedRating
        ? 'Deine Bewertung: ' + formatRating(selectedRating) + ' von 5 Sternen'
        : 'Wähle zwischen einem halben und fünf Sternen.';
    }
  });

  function showFormMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = 'review-form-message' + (type ? ' ' + type : '');
    formMessage.hidden = !message;
  }

  function createVisitorToken() {
    try {
      const existing = localStorage.getItem(visitorKey);
      if (existing) return existing;
      const token = (window.crypto && typeof window.crypto.randomUUID === 'function')
        ? window.crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
            const random = Math.random() * 16 | 0;
            return (char === 'x' ? random : (random & 3 | 8)).toString(16);
          });
      localStorage.setItem(visitorKey, token);
      return token;
    } catch (_) {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const random = Math.random() * 16 | 0;
        return (char === 'x' ? random : (random & 3 | 8)).toString(16);
      });
    }
  }

  function renderSummary(reviews) {
    const count = reviews.length;
    const average = count
      ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / count
      : 0;
    averageEl.textContent = count ? formatRating(average) + ' / 5' : 'Noch keine Bewertungen';
    countEl.textContent = count === 1 ? '1 freigegebene Bewertung' : count + ' freigegebene Bewertungen';
    addStarVisual(summaryStars, average, false);
    summaryStars.setAttribute('aria-label', count ? 'Durchschnittlich ' + formatRating(average) + ' von 5 Sternen' : 'Noch keine Bewertungen');
  }

  function renderReviews(reviews) {
    reviewList.replaceChildren();
    if (!reviews.length) {
      const empty = document.createElement('p');
      empty.className = 'review-empty';
      empty.textContent = 'Noch keine freigegebenen Bewertungen. Vielleicht bist du die erste Person?';
      reviewList.appendChild(empty);
      return;
    }

    reviews.forEach((review) => {
      const item = document.createElement('article');
      item.className = 'review-entry';

      const top = document.createElement('div');
      top.className = 'review-entry-top';

      const author = document.createElement('strong');
      author.className = 'review-entry-author';
      author.textContent = review.display_name || 'Gast';

      const date = document.createElement('time');
      date.className = 'review-entry-date';
      const parsed = new Date(review.created_at);
      date.textContent = Number.isNaN(parsed.getTime())
        ? ''
        : new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }).format(parsed);

      const stars = document.createElement('div');
      stars.className = 'review-entry-stars';
      addStarVisual(stars, Number(review.rating), false);
      stars.setAttribute('aria-label', formatRating(Number(review.rating)) + ' von 5 Sternen');

      const comment = document.createElement('p');
      comment.className = 'review-entry-comment';
      comment.textContent = review.comment;

      top.append(author, date);
      item.append(top, stars, comment);
      reviewList.appendChild(item);
    });
  }

  async function loadReviews() {
    const result = await client.from('blog_post_reviews')
      .select('rating,display_name,comment,created_at')
      .eq('post_id', postId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50);

    if (result.error) throw result.error;
    const reviews = result.data || [];
    renderSummary(reviews);
    renderReviews(reviews);
  }

  if (!window.supabase || !cfg.url || !cfg.anonKey || !postId) {
    showFormMessage('Das Bewertungsformular ist gerade nicht verfügbar.', 'error');
    return;
  }

  client = window.supabase.createClient(cfg.url, cfg.anonKey);
  addStarVisual(picker, 0, true);

  if (localStorage.getItem(submittedKey) === 'yes') {
    form.hidden = true;
    successMessage.hidden = false;
    successMessage.textContent = 'Danke! Deine Bewertung wurde eingereicht und wird nach einer kurzen Prüfung angezeigt.';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showFormMessage('', '');

    if (!form.reportValidity()) return;
    if (!selectedRating) {
      showFormMessage('Bitte wähle zuerst deine Sternebewertung aus.', 'error');
      picker.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const honeypot = document.getElementById('review-website');
    if (honeypot && honeypot.value.trim()) {
      form.hidden = true;
      successMessage.hidden = false;
      successMessage.textContent = 'Danke für deine Rückmeldung!';
      return;
    }

    const nameInput = document.getElementById('reviewer-name');
    const commentInput = document.getElementById('review-comment');
    const consent = document.getElementById('review-consent');
    const displayName = nameInput.value.trim() || 'Gast';
    const comment = commentInput.value.trim();

    if (!consent.checked) {
      showFormMessage('Bitte bestätige noch die Veröffentlichung nach Prüfung.', 'error');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Wird gesendet …';

    const result = await client.from('blog_post_reviews').insert({
      post_id: postId,
      rating: selectedRating,
      display_name: displayName,
      comment: comment,
      visitor_token: createVisitorToken(),
      status: 'pending'
    });

    if (result.error) {
      if (result.error.code === '23505') {
        showFormMessage('Mit diesem Browser wurde dieser Beitrag bereits bewertet.', 'error');
      } else {
        console.error('Bewertung konnte nicht gespeichert werden:', result.error);
        showFormMessage('Deine Bewertung konnte gerade nicht gespeichert werden. Bitte versuche es später noch einmal.', 'error');
      }
      submitButton.disabled = false;
      submitButton.textContent = 'Bewertung senden';
      return;
    }

    try { localStorage.setItem(submittedKey, 'yes'); } catch (_) {}
    form.hidden = true;
    successMessage.hidden = false;
    successMessage.textContent = 'Vielen Dank! Deine Bewertung wurde eingereicht und wird nach einer kurzen Prüfung unter diesem Beitrag angezeigt.';
  });

  loadReviews().catch((error) => {
    console.error('Blogbewertungen konnten nicht geladen werden:', error);
    reviewList.textContent = 'Bewertungen konnten gerade nicht geladen werden.';
  });
})();