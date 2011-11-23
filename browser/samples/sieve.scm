(define (sieve n)
  (if (= n 2) (cons 2 '())
              (primes (countup n))))

(define (countup n)
  (if (= n 2) (cons 2 '())
              (append n (countup (- n 1)))))

(define (append n L)
  (if (null? L) (cons n '())
                (cons (car L) (append n (cdr L)))))

(define (primes L)
  (if (null? L) '()
                (cons (car L) (primes (remove (car L) L)))))

(define (remove n L)
  (cond ((null? L) '())
        ((= 0 (modulo (car L) n)) (remove n (cdr L)))
        (#t (cons (car L) (remove n (cdr L))))))

(sieve 25)
