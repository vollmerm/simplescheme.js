(define (tail_factorial i)
  (define (facthelp i prod)
    (if (= i 1) prod
        (facthelp (- i 1) (* i prod))))
  (facthelp i 1))

(tail_factorial 1000)
